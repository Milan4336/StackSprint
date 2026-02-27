"""
Isolation Forest anomaly model — extracted and improved from the original model.py.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest


class IsolationForestModel:
    """
    Wrapper around sklearn IsolationForest.
    Outputs a probability in [0, 1] — higher means more likely fraudulent.
    """

    def __init__(self, n_estimators: int = 200, contamination: float = 0.05) -> None:
        self._clf = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=42,
        )
        self.is_fitted = False
        self.version = "1.0.0"
        self.name = "isolation_forest"

    # ------------------------------------------------------------------
    def train(self, X: np.ndarray) -> None:
        self._clf.fit(X)
        self.is_fitted = True

    def train_on_synthetic(self) -> None:
        rng = np.random.default_rng(42)
        normal = np.column_stack([
            rng.normal(120, 40, 5000),
            rng.normal(0, 1, 5000),
            rng.poisson(2, 5000),
            rng.normal(15, 8, 5000),
            rng.normal(0.7, 0.2, 5000),
        ])
        self.train(normal)

    # ------------------------------------------------------------------
    def score(self, features: list[float]) -> float:
        """Return fraud probability in [0, 1]."""
        if not self.is_fitted:
            self.train_on_synthetic()
        vec = np.array([features])
        decision = float(self._clf.decision_function(vec)[0])
        # Lower decision score → higher anomaly → higher fraud probability
        prob = 1.0 / (1.0 + np.exp(8.0 * decision))
        return float(np.clip(prob, 0.0, 1.0))
