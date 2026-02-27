"""
PyTorch MLP Autoencoder for anomaly detection.
Reconstruction error on normal-transaction features indicates fraud likelihood.
Kept lightweight — no GPU, no heavy dependencies.
"""
from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


class _MLP(nn.Module):
    def __init__(self, input_dim: int = 5, hidden_dim: int = 12, bottleneck: int = 4) -> None:
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, bottleneck),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(bottleneck, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        return self.decoder(self.encoder(x))


class AutoencoderModel:
    """
    Shallow MLP autoencoder trained on normal transaction features.
    High reconstruction error → anomalous → higher fraud score.
    Threshold is the 95th-percentile reconstruction error on training data.
    """

    def __init__(self) -> None:
        self._net = _MLP()
        self._threshold: float = 1.0
        self._scaler_mean: np.ndarray | None = None
        self._scaler_std: np.ndarray | None = None
        self.is_fitted = False
        self.version = "1.0.0"
        self.name = "autoencoder"

    # ------------------------------------------------------------------
    def _normalize(self, X: np.ndarray) -> np.ndarray:
        if self._scaler_mean is None:
            return X
        return (X - self._scaler_mean) / (self._scaler_std + 1e-8)

    def _reconstruct_error(self, X_norm: np.ndarray) -> np.ndarray:
        tensor = torch.tensor(X_norm, dtype=torch.float32)
        with torch.no_grad():
            out = self._net(tensor)
        return ((tensor - out) ** 2).mean(dim=1).numpy()

    # ------------------------------------------------------------------
    def train_on_synthetic(self) -> None:
        rng = np.random.default_rng(42)
        X = np.column_stack([
            rng.normal(120, 40, 5000),
            rng.normal(0, 0.5, 5000),
            rng.poisson(1.5, 5000),
            rng.normal(10, 5, 5000),
            rng.normal(0.5, 0.15, 5000),
        ]).astype(np.float32)
        self.train(X)

    def train(self, X: np.ndarray) -> None:
        X = X.astype(np.float32)
        self._scaler_mean = X.mean(axis=0)
        self._scaler_std = X.std(axis=0) + 1e-8
        X_norm = self._normalize(X).astype(np.float32)

        dataset = TensorDataset(torch.tensor(X_norm))
        loader = DataLoader(dataset, batch_size=128, shuffle=True)

        optimizer = torch.optim.Adam(self._net.parameters(), lr=1e-3)
        criterion = nn.MSELoss()

        self._net.train()
        for _ in range(30):  # 30 epochs — fast but effective
            for (batch,) in loader:
                optimizer.zero_grad()
                out = self._net(batch)
                loss = criterion(out, batch)
                loss.backward()
                optimizer.step()

        # Set threshold at 95th percentile of training reconstruction errors
        self._net.eval()
        errors = self._reconstruct_error(X_norm)
        self._threshold = float(np.percentile(errors, 95))
        self.is_fitted = True

    # ------------------------------------------------------------------
    def score(self, features: list[float]) -> float:
        """Return fraud probability in [0, 1] based on reconstruction error."""
        if not self.is_fitted:
            self.train_on_synthetic()

        X = np.array([features], dtype=np.float32)
        X_norm = self._normalize(X).astype(np.float32)
        self._net.eval()
        error = float(self._reconstruct_error(X_norm)[0])

        # Sigmoid-like mapping: error relative to threshold
        ratio = error / (self._threshold + 1e-8)
        prob = 1.0 / (1.0 + np.exp(-4.0 * (ratio - 1.0)))
        return float(np.clip(prob, 0.0, 1.0))
