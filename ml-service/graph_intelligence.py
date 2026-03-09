"""
Graph Fraud Intelligence Engine — NetworkX-powered in-memory graph.

Computes per-user metrics:
  - node_degree
  - fraud_neighbor_ratio
  - shared_device_count
  - shared_ip_count
  - cluster_density
  - triangle_count
  - graph_score (weighted composite)

Graph is updated on every /predict call and queried by /graph/analytics.
"""
from __future__ import annotations

import hashlib
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Set, Any, Optional

from datetime import datetime
from pydantic import BaseModel
import networkx as nx

logger = logging.getLogger(__name__)


class GraphContext(BaseModel):
    userId: str
    amount: float
    location: str
    deviceId: str
    timestamp: datetime
    ipAddress: str
    fraudScore: Optional[float] = None
    isFraud: Optional[bool] = None


@dataclass
class NodeMetrics:
    node_id: str
    node_type: str  # 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION'
    node_degree: int = 0
    fraud_neighbor_ratio: float = 0.0
    shared_device_count: int = 0
    shared_ip_count: int = 0
    cluster_density: float = 0.0
    triangle_count: int = 0
    graph_score: float = 0.0
    is_fraud_neighbor: bool = False
    fraud_score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodeId": self.node_id,
            "nodeType": self.node_type,
            "nodeDegree": self.node_degree,
            "fraudNeighborRatio": round(self.fraud_neighbor_ratio, 4),
            "sharedDeviceCount": self.shared_device_count,
            "sharedIPCount": self.shared_ip_count,
            "clusterDensity": round(self.cluster_density, 4),
            "triangleCount": self.triangle_count,
            "graphScore": round(self.graph_score, 4),
            "isFraudNeighbor": self.is_fraud_neighbor,
            "fraudScore": round(self.fraud_score, 4),
        }


@dataclass
class FraudCluster:
    cluster_id: str
    members: List[str]
    shared_devices: List[str]
    shared_ips: List[str]
    avg_fraud_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "clusterId": self.cluster_id,
            "members": self.members,
            "sharedDevices": self.shared_devices,
            "sharedIPs": self.shared_ips,
            "avgFraudScore": round(self.avg_fraud_score, 4),
            "size": len(self.members),
        }


class GraphIntelligenceEngine:
    """
    In-memory NetworkX DiGraph tracking relationships between
    users, devices, IPs, and transactions.
    """

    def __init__(self) -> None:
        self._G: nx.DiGraph = nx.DiGraph()
        # Track per-user metadata
        self._user_fraud_scores: Dict[str, float] = {}
        self._user_devices: Dict[str, Set[str]] = defaultdict(set)
        self._user_ips: Dict[str, Set[str]] = defaultdict(set)
        self._device_users: Dict[str, Set[str]] = defaultdict(set)
        self._ip_users: Dict[str, Set[str]] = defaultdict(set)

    # ── Update graph ─────────────────────────────────────────────────────────

    def update_graph(self, context: Any) -> None:
        """Add/update nodes and edges for a new transaction event."""
        user_id = context.get("userId")
        device_id = context.get("deviceId")
        ip_address = context.get("ipAddress")
        transaction_id = context.get("transactionId")
        fraud_score = context.get("fraudScore", 0.0)
        is_fraud = context.get("isFraud", False)

        if not user_id or not device_id or not ip_address:
            return

        # Ensure nodes exist
        self._ensure_node(user_id, "USER", fraud_score=fraud_score, is_fraud=is_fraud)
        self._ensure_node(device_id, "DEVICE")
        self._ensure_node(ip_address, "IP")

        # Edges
        self._G.add_edge(user_id, device_id, rel="USER_DEVICE")
        self._G.add_edge(user_id, ip_address, rel="USER_IP")
        self._G.add_edge(device_id, ip_address, rel="DEVICE_IP")

        if transaction_id:
            self._ensure_node(transaction_id, "TRANSACTION", fraud_score=fraud_score)
            self._G.add_edge(transaction_id, user_id, rel="TX_USER", fraud_score=fraud_score)

        # Track metadata
        self._user_fraud_scores[user_id] = fraud_score
        self._user_devices[user_id].add(device_id)
        self._user_ips[user_id].add(ip_address)
        self._device_users[device_id].add(user_id)
        self._ip_users[ip_address].add(user_id)

    def _ensure_node(self, node_id: str, node_type: str, fraud_score: float = 0.0, is_fraud: bool = False) -> None:
        if not self._G.has_node(node_id):
            self._G.add_node(node_id, type=node_type, fraud_score=fraud_score, is_fraud=is_fraud)
        elif fraud_score > 0:
            self._G.nodes[node_id]["fraud_score"] = max(self._G.nodes[node_id].get("fraud_score", 0), fraud_score)
            if is_fraud:
                self._G.nodes[node_id]["is_fraud"] = True

    # ── Compute metrics for a single user ────────────────────────────────────

    def get_node_metrics(self, user_id: str) -> Dict[str, Any]:
        if not self._G.has_node(user_id):
            return NodeMetrics(node_id=user_id, node_type="USER").to_dict()

        metrics = NodeMetrics(node_id=user_id, node_type="USER")

        # Degree (undirected view for better connectivity signal)
        undirected = self._G.to_undirected()
        metrics.node_degree = undirected.degree(user_id)

        # Fraud neighbor ratio
        neighbors = list(undirected.neighbors(user_id))
        if neighbors:
            fraud_neighbors = sum(
                1 for n in neighbors
                if self._G.nodes[n].get("is_fraud", False) or self._G.nodes[n].get("fraud_score", 0) >= 0.6
            )
            metrics.fraud_neighbor_ratio = fraud_neighbors / len(neighbors)

        # Shared device counts (devices used by >1 user)
        devices = self._user_devices.get(user_id, set())
        metrics.shared_device_count = sum(
            1 for d in devices if len(self._device_users.get(d, set())) > 1
        )

        # Shared IP counts (IPs used by >1 user)
        ips = self._user_ips.get(user_id, set())
        metrics.shared_ip_count = sum(
            1 for ip in ips if len(self._ip_users.get(ip, set())) > 1
        )

        # Cluster density — ego-graph
        try:
            ego = nx.ego_graph(undirected, user_id, radius=1)
            n = ego.number_of_nodes()
            e = ego.number_of_edges()
            possible = n * (n - 1) / 2 if n > 1 else 1
            metrics.cluster_density = e / possible
        except Exception:
            metrics.cluster_density = 0.0

        # Triangle count
        try:
            tri = nx.triangles(undirected, user_id)
            metrics.triangle_count = tri
        except Exception:
            metrics.triangle_count = 0

        # Graph fraud score
        # Normalise shared counts (cap at 5 for saturation)
        norm_devices = min(1.0, metrics.shared_device_count / 5.0)
        norm_ips = min(1.0, metrics.shared_ip_count / 5.0)
        norm_degree = min(1.0, metrics.node_degree / 20.0)

        metrics.graph_score = (
            0.30 * metrics.fraud_neighbor_ratio
            + 0.20 * norm_devices
            + 0.20 * norm_ips
            + 0.15 * metrics.cluster_density
            + 0.15 * norm_degree
        )

        metrics.fraud_score = self._user_fraud_scores.get(user_id, 0.0)
        return metrics.to_dict()

    # ── Get all analytics ─────────────────────────────────────────────────────

    def get_full_analytics(self) -> Dict[str, Any]:
        """Returns metrics for all USER nodes and detected fraud clusters."""
        user_metrics: List[Dict] = []
        for node_id, attrs in self._G.nodes(data=True):
            if attrs.get("type") == "USER":
                user_metrics.append(self.get_node_metrics(node_id))

        clusters = self._detect_fraud_clusters()

        return {
            "nodes": user_metrics,
            "clusters": [c.to_dict() for c in clusters],
            "totalNodes": self._G.number_of_nodes(),
            "totalEdges": self._G.number_of_edges(),
        }

    def _detect_fraud_clusters(self) -> List[FraudCluster]:
        """Find connected components where avg fraud score > 0.5."""
        undirected = self._G.to_undirected()
        clusters: List[FraudCluster] = []

        for component in nx.connected_components(undirected):
            users_in_comp = [
                n for n in component
                if self._G.nodes[n].get("type") == "USER"
            ]
            if len(users_in_comp) < 2:
                continue

            scores = [self._user_fraud_scores.get(u, 0.0) for u in users_in_comp]
            avg_score = sum(scores) / len(scores) if scores else 0.0

            if avg_score < 0.4:
                continue

            # Shared devices and IPs
            all_devices: List[str] = []
            all_ips: List[str] = []
            for u in users_in_comp:
                all_devices.extend(self._user_devices.get(u, set()))
                all_ips.extend(self._user_ips.get(u, set()))

            shared_devs = [d for d in set(all_devices) if len(self._device_users.get(d, set())) > 1]
            shared_ips_list = [ip for ip in set(all_ips) if len(self._ip_users.get(ip, set())) > 1]

            cluster_id = hashlib.sha256("|".join(sorted(users_in_comp)).encode()).hexdigest()[:12]
            clusters.append(FraudCluster(
                cluster_id=cluster_id,
                members=users_in_comp,
                shared_devices=shared_devs,
                shared_ips=shared_ips_list,
                avg_fraud_score=avg_score,
            ))

        return clusters

    def get_graph_score(self, user_id: str) -> float:
        """Quick helper to get just the graph score for a user during scoring."""
        return self.get_node_metrics(user_id).get("graphScore", 0.0)


# Singleton instance shared across FastAPI app
graph_engine = GraphIntelligenceEngine()
