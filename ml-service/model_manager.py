"""
Model manager — handles blue-green deployment of the ensemble.
Tracks 'active' vs 'candidate' model groups.
"""
from __future__ import annotations

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self) -> None:
        self._active_version: str = "1.0.0"
        self._candidate_version: str | None = None
        self._active_metrics: Dict[str, float] = {}
        self._candidate_metrics: Dict[str, float] = {}
        self._is_swapping: bool = False

    def set_candidate(self, version: str, metrics: Dict[str, float]) -> None:
        self._candidate_version = version
        self._candidate_metrics = metrics
        logger.info(f"Candidate model {version} registered with AUC: {metrics.get('auc', 0):.4f}")

    def promote_candidate(self) -> bool:
        if not self._candidate_version:
            return False
        
        logger.info(f"Promoting candidate {self._candidate_version} to active (Blue-Green Switch)")
        self._active_version = self._candidate_version
        self._active_metrics = self._candidate_metrics
        self._candidate_version = None
        self._candidate_metrics = {}
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "active": {
                "version": self._active_version,
                "metrics": self._active_metrics,
            },
            "candidate": {
                "version": self._candidate_version,
                "metrics": self._candidate_metrics,
            }
        }

model_manager = ModelManager()
