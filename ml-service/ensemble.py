"""
Ensemble fraud detector — weighted combination of 3 models with per-model fallback.

Default weights (overridable via env vars):
  WEIGHT_XGBOOST          = 0.45
  WEIGHT_ISOLATION_FOREST = 0.35
  WEIGHT_AUTOENCODER      = 0.20
"""
from __future__ import annotations

import os
import logging
from dataclasses import dataclass, field

import numpy as np

from isolation_forest_model import IsolationForestModel
from xgboost_model import XGBoostModel
from autoencoder_model import AutoencoderModel
from registry import ModelRegistry

logger = logging.getLogger(__name__)


@dataclass
class ModelResult:
    name: str
    score: float
    weight: float
    available: bool = True
    error: str | None = None


@dataclass
class EnsembleResult:
    fraud_score: float
    is_fraud: bool
    confidence: float
    model_scores: dict[str, float]
    model_weights: dict[str, float]
    explanations: list[dict]


class EnsembleModel:
    """
    Weighted ensemble of IsolationForest + XGBoost + Autoencoder.
    If a model fails at inference, its weight is redistributed proportionally.
    """

    def __init__(self, registry: ModelRegistry) -> None:
        self._if = IsolationForestModel()
        self._xgb = XGBoostModel()
        self._ae = AutoencoderModel()
        self._registry = registry

        self._weights = {
            "isolation_forest": float(os.getenv("WEIGHT_ISOLATION_FOREST", "0.35")),
            "xgboost":          float(os.getenv("WEIGHT_XGBOOST", "0.45")),
            "autoencoder":      float(os.getenv("WEIGHT_AUTOENCODER", "0.20")),
        }
        self._threshold = float(os.getenv("FRAUD_THRESHOLD", "0.55"))

    # ------------------------------------------------------------------
    def train_all(self) -> None:
        """Train all models on synthetic data and register them."""
        logger.info("Training ensemble models on synthetic data …")

        self._if.train_on_synthetic()
        self._registry.register("isolation_forest", self._if.version)

        self._xgb.train_on_synthetic()
        self._registry.register("xgboost", self._xgb.version)

        self._ae.train_on_synthetic()
        self._registry.register("autoencoder", self._ae.version)

        logger.info("All models trained and registered.")

    # ------------------------------------------------------------------
    def _safe_score(self, model, features: list[float], name: str) -> ModelResult:
        try:
            s = model.score(features)
            return ModelResult(name=name, score=s, weight=self._weights[name])
        except Exception as exc:  # noqa: BLE001
            logger.warning("Model %s failed: %s", name, exc)
            return ModelResult(name=name, score=0.0, weight=0.0, available=False, error=str(exc))

    def _weighted_score(self, results: list[ModelResult]) -> tuple[float, float]:
        """Returns (ensemble_score, confidence)."""
        available = [r for r in results if r.available]
        if not available:
            return 0.0, 0.0

        total_weight = sum(r.weight for r in available)
        ensemble = sum(r.score * r.weight for r in available) / total_weight

        # Confidence: 1 - stddev of available model scores (all agree → high confidence)
        scores = [r.score for r in available]
        confidence = float(1.0 - np.std(scores)) if len(scores) > 1 else 0.7
        confidence = float(np.clip(confidence, 0.0, 1.0))
        return float(np.clip(ensemble, 0.0, 1.0)), confidence

    # ------------------------------------------------------------------
    def predict(self, features: list[float], location: str, device_id: str) -> EnsembleResult:
        results = [
            self._safe_score(self._if, features, "isolation_forest"),
            self._safe_score(self._xgb, features, "xgboost"),
            self._safe_score(self._ae, features, "autoencoder"),
        ]

        ensemble_score, confidence = self._weighted_score(results)

        model_scores  = {r.name: round(r.score, 4) for r in results}
        model_weights = {r.name: round(self._weights[r.name], 4) for r in results}

        # Build explanations from feature values (same logic as before)
        explanations = self._build_explanations(features, ensemble_score, location, device_id)

        return EnsembleResult(
            fraud_score=round(ensemble_score, 4),
            is_fraud=ensemble_score >= self._threshold,
            confidence=round(confidence, 4),
            model_scores=model_scores,
            model_weights=model_weights,
            explanations=explanations,
        )

    # ------------------------------------------------------------------
    @staticmethod
    def _build_explanations(
        features: list[float],
        prob: float,
        location: str,
        device_id: str,
    ) -> list[dict]:
        amount, amount_z, tx_freq, geo_delta, device_entropy = features

        raw_impacts = {
            "amount":   min(1.0, 0.25 + abs(amount_z) * 0.25 + amount / 100_000.0),
            "location": min(1.0, geo_delta / 8_000.0),
            "device":   min(1.0, 0.25 + device_entropy * 0.25 + (0.3 if device_id.startswith("unknown") else 0.0)),
            "velocity": min(1.0, tx_freq / 10.0),
        }
        reasons = {
            "amount":   "Amount significantly above user average" if abs(amount_z) > 1.4 else "Amount within expected user profile",
            "location": "Unusual geographic location" if geo_delta > 2_000 else f"Location {location} close to recent activity",
            "device":   "Unknown device detected" if device_id.startswith("unknown") else "Device fingerprint seen previously",
            "velocity": "High transaction velocity in short window" if tx_freq >= 4 else "Normal transaction velocity",
        }
        total = sum(raw_impacts.values()) or 1.0
        ordered = sorted(raw_impacts.items(), key=lambda x: x[1], reverse=True)[:3]
        return [
            {"feature": feat, "impact": round(imp / total, 2), "reason": reasons[feat]}
            for feat, imp in ordered
        ]
