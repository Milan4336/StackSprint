"""
Model registry — tracks version, training time, and metrics using MLflow.
"""
from __future__ import annotations

import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

import mlflow
from mlflow.tracking import MlflowClient

logger = logging.getLogger(__name__)

# MLflow configuration
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "sqlite:///mlflow.db")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment("FraudDetection")

class ModelRegistry:
    def __init__(self) -> None:
        self.client = MlflowClient()
        self._active_models: Dict[str, Dict[str, Any]] = {}

    def register(
        self,
        model_name: str,
        version: str,
        metrics: Dict[str, float] | None = None,
        params: Dict[str, Any] | None = None,
    ) -> None:
        """Register a new model run in MLflow."""
        with mlflow.start_run(run_name=f"{model_name}_{version}"):
            # Log params and metrics to MLflow
            if params:
                mlflow.log_params(params)
            
            if metrics:
                mlflow.log_metrics(metrics)
            
            mlflow.set_tag("model_type", model_name)
            mlflow.set_tag("version", version)
            
            run_id = mlflow.active_run().info.run_id # type: ignore
            
            model_info = {
                "modelName": model_name,
                "version": version,
                "trainedAt": datetime.now(tz=timezone.utc).isoformat(),
                "metrics": metrics or {},
                "status": "active",
                "runId": run_id
            }
            
            self._active_models[model_name] = model_info
            logger.info(f"Model {model_name} v{version} registered in MLflow (Run ID: {run_id})")

    def get(self, model_name: str) -> Dict[str, Any] | None:
        return self._active_models.get(model_name)

    def all(self) -> List[Dict[str, Any]]:
        return list(self._active_models.values())

    def get_history(self, model_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch historical runs for a model from MLflow."""
        runs = self.client.search_runs(
            experiment_ids=[self.client.get_experiment_by_name("FraudDetection").experiment_id], # type: ignore
            filter_string=f"tags.model_type = '{model_name}'",
            max_results=limit,
            order_by=["attribute.start_time DESC"]
        )
        
        history = []
        for run in runs:
            history.append({
                "runId": run.info.run_id,
                "version": run.data.tags.get("version", "unknown"),
                "trainedAt": datetime.fromtimestamp(run.info.start_time / 1000.0, tz=timezone.utc).isoformat(),
                "metrics": run.data.metrics,
            })
        return history

# Singleton instance
model_registry = ModelRegistry()
