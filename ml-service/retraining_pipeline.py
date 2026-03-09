"""
Retraining engine — orchestrates data fetching, training, validation, and registration.
"""
from __future__ import annotations

import os
import logging
import asyncio
import httpx
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, roc_auc_score, confusion_matrix
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest

from registry import ModelRegistry
from model_manager import model_manager

logger = logging.getLogger(__name__)

# Config
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:3000")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "ml_service_internal_token") # Needs to match a valid admin token or internal secret
VALIDATION_AUC_THRESHOLD = float(os.getenv("VALIDATION_AUC_THRESHOLD", "0.80"))
VALIDATION_FPR_THRESHOLD = float(os.getenv("VALIDATION_FPR_THRESHOLD", "0.05"))

# Node: In a real system, we'd use a more robust auth mechanism for internal service calls
HEADERS = {"Authorization": f"Bearer {ADMIN_TOKEN}"}

class RetrainingEngine:
    def __init__(self, registry: ModelRegistry) -> None:
        self.registry = registry
        self._is_running = False

    async def fetch_training_data(self, limit: int = 2000) -> pd.DataFrame:
        """Fetch labeled transactions from the API Gateway."""
        logger.info(f"Fetching {limit} labeled transactions from API Gateway...")
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(
                    f"{API_GATEWAY_URL}/api/v1/ml/training-data",
                    params={"limit": limit},
                    headers=HEADERS
                )
                resp.raise_for_status()
                data = resp.json()
                
                if not data:
                    logger.warning("No training data received.")
                    return pd.DataFrame()
                
                df = pd.DataFrame(data)
                logger.info(f"Successfully fetched {len(df)} transactions.")
                return df
        except Exception as e:
            logger.error(f"Failed to fetch training data: {e}")
            return pd.DataFrame()

    def preprocess_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Convert transaction JSON to feature matrix."""
        # Simple feature engineering for this demo
        features = pd.DataFrame()
        features["amount"] = df["amount"]
        features["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
        features["day_of_week"] = pd.to_datetime(df["timestamp"]).dt.dayofweek
        
        # Categorical encoding (simplified)
        features["is_usd"] = (df["currency"] == "USD").astype(int)
        
        # Risk scores (already provided by API Gateway for labeling)
        features["prev_fraud_score"] = df.get("fraudScore", 0.5)
        
        # Target variable
        target = df["isFraud"].astype(int)
        
        return features, target

    def validate_model(self, model: Any, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, float]:
        """Compute performance metrics."""
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
        
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5
        
        # False Positive Rate
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred, labels=[0, 1]).ravel()
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        return {
            "precision": float(precision),
            "recall": float(recall),
            "auc": float(auc),
            "fpr": float(fpr),
            "accuracy": float((tp + tn) / (tp + tn + fp + fn))
        }

    async def run_pipeline(self) -> bool:
        """Main orchestrator for retraining."""
        if self._is_running:
            logger.warning("Retraining pipeline is already running.")
            return False
            
        self._is_running = True
        logger.info("Starting adaptive ML retraining pipeline...")
        
        try:
            # 1. Fetch data
            df = await self.fetch_training_data()
            if df.empty or len(df) < 100:
                logger.warning("Insufficient data for retraining (need at least 100 samples).")
                self._is_running = False
                return False
                
            # 2. Preprocess
            X, y = self.preprocess_data(df)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # 3. Retrain XGBoost (Main Model)
            logger.info("Retraining XGBoost model...")
            new_model = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1)
            new_model.fit(X_train, y_train)
            
            # 4. Validate
            metrics = self.validate_model(new_model, X_test, y_test)
            logger.info(f"Validation metrics: {metrics}")
            
            # 5. Registry & Model Selection
            version = datetime.now(tz=timezone.utc).strftime("%Y.%m.%d.%H%M")
            self.registry.register(
                model_name="xgboost",
                version=version,
                metrics=metrics,
                params={"n_estimators": 100, "max_depth": 5}
            )
            
            # 6. Blue-Green Deployment Decision
            if metrics["auc"] >= VALIDATION_AUC_THRESHOLD and metrics["fpr"] <= VALIDATION_FPR_THRESHOLD:
                logger.info(f"Model validation PASSED (AUC: {metrics['auc']:.4f}). Setting as candidate.")
                model_manager.set_candidate(version, metrics)
                
                # In this demo, we auto-promote for feedback visibility
                model_manager.promote_candidate()
                return True
            else:
                logger.warning(
                    f"Model validation FAILED. AUC: {metrics['auc']:.4f} (Required: {VALIDATION_AUC_THRESHOLD}), "
                    f"FPR: {metrics['fpr']:.4f} (Required: {VALIDATION_FPR_THRESHOLD})"
                )
                return False
                
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}")
            return False
        finally:
            self._is_running = False

from registry import model_registry
retraining_engine = RetrainingEngine(model_registry)
