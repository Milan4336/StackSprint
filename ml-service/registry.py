"""
Model registry — tracks version, training time, and metrics for each model.
Persisted to a local JSON file inside the container.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any


REGISTRY_PATH = os.getenv("MODEL_REGISTRY_PATH", "model_registry.json")


class ModelRegistry:
    def __init__(self) -> None:
        self._data: dict[str, dict[str, Any]] = {}
        self._load()

    # ------------------------------------------------------------------
    def _load(self) -> None:
        if os.path.exists(REGISTRY_PATH):
            try:
                with open(REGISTRY_PATH) as f:
                    self._data = json.load(f)
            except (json.JSONDecodeError, OSError):
                self._data = {}

    def _save(self) -> None:
        try:
            with open(REGISTRY_PATH, "w") as f:
                json.dump(self._data, f, indent=2, default=str)
        except OSError:
            pass

    # ------------------------------------------------------------------
    def register(
        self,
        model_name: str,
        version: str,
        metrics: dict[str, float] | None = None,
    ) -> None:
        self._data[model_name] = {
            "modelName": model_name,
            "version": version,
            "trainedAt": datetime.now(tz=timezone.utc).isoformat(),
            "metrics": metrics or {},
            "status": "active",
        }
        self._save()

    def get(self, model_name: str) -> dict[str, Any] | None:
        return self._data.get(model_name)

    def all(self) -> list[dict[str, Any]]:
        return list(self._data.values())
