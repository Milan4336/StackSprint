"""
XGBoost binary classifier for fraud detection.
Trained on synthetic labeled data: normal vs. anomalous feature vectors.
"""
from __future__ import annotations

import numpy as np
import xgboost as xgb


class XGBoostModel:
    """
    XGBoost binary classifier. Class 1 = fraud.
    Outputs probability in [0, 1].
    """

    def __init__(self) -> None:
        self._clf: xgb.XGBClassifier | None = None
        self.is_fitted = False
        self.version = "1.0.0"
        self.name = "xgboost"

    # ------------------------------------------------------------------
    @staticmethod
    def _generate_synthetic_data(n_normal: int = 4000, n_fraud: int = 400) -> tuple[np.ndarray, np.ndarray]:
        rng = np.random.default_rng(42)

        # Normal transactions: moderate amounts, low velocity, common locations
        X_normal = np.column_stack([
            rng.normal(120, 40, n_normal),          # amount
            rng.normal(0, 0.5, n_normal),            # amount_z
            rng.poisson(1.5, n_normal),              # tx_freq
            rng.normal(10, 5, n_normal),             # geo_delta (km)
            rng.normal(0.5, 0.15, n_normal),         # device_entropy
        ])

        # Fraudulent transactions: high amounts, high velocity, unknown locations
        X_fraud = np.column_stack([
            rng.normal(800, 300, n_fraud),           # high amount
            rng.normal(3.5, 1.0, n_fraud),           # high z-score
            rng.poisson(6, n_fraud),                 # high velocity
            rng.normal(4000, 1500, n_fraud),         # large geo jump
            rng.normal(1.8, 0.4, n_fraud),           # high device entropy
        ])

        X = np.vstack([X_normal, X_fraud])
        y = np.array([0] * n_normal + [1] * n_fraud)
        return X, y

    def train_on_synthetic(self) -> None:
        X, y = self._generate_synthetic_data()
        self._clf = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        )
        self._clf.fit(X, y)
        self.is_fitted = True

    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        self._clf = xgb.XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        )
        self._clf.fit(X, y)
        self.is_fitted = True

    # ------------------------------------------------------------------
    def score(self, features: list[float]) -> float:
        """Return fraud probability in [0, 1]."""
        if not self.is_fitted:
            self.train_on_synthetic()
        vec = np.array([features])
        prob = float(self._clf.predict_proba(vec)[0][1])
        return float(np.clip(prob, 0.0, 1.0))
