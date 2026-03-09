from __future__ import annotations

import time
import logging
import asyncio
from collections import deque
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from features import FeatureEngineer
from ensemble import ensemble
from registry import ModelRegistry
from graph_intelligence import graph_engine, GraphContext
from model_manager import model_manager
from retraining_pipeline import retraining_engine

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Pydantic schemas ────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    userId: str = Field(min_length=1)
    amount: float = Field(gt=0)
    location: str = Field(min_length=2)
    deviceId: str = Field(min_length=1)
    timestamp: datetime
    graphContext: Optional[GraphContext] = None

class RetrainRequest(BaseModel):
    async_mode: bool = True

class EnsembleConfigRequest(BaseModel):
    weights: dict[str, float] | None = None
    fraud_threshold: float | None = None

# ── App bootstrap ────────────────────────────────────────────────────────────
feature_engineer = FeatureEngineer()
registry = retraining_engine.registry
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler for daily retraining
    scheduler.add_job(
        retraining_engine.run_pipeline,
        CronTrigger(hour=0, minute=0),
        id="model_retraining"
    )
    scheduler.start()
    logger.info("ML Retraining Scheduler started (Daily at 00:00)")
    yield
    scheduler.shutdown()

app = FastAPI(
    title="Stack Sprint — ML Fraud Engine", 
    version="3.1.0",
    lifespan=lifespan
)

# ── Prometheus metrics ───────────────────────────────────────────────────────
requests_total = Counter("ml_requests_total", "Total ML requests", ["endpoint"])
fraud_score_hist = Histogram("ml_fraud_score", "Distribution of fraud scores", buckets=[0.1 * i for i in range(11)])

# ── Runtime stats ────────────────────────────────────────────────────────────
_recent_scores: deque[float] = deque(maxlen=1000)

# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health() -> dict:
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "3.1.0",
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "graph": {
            "nodes": graph_engine._G.number_of_nodes(),
            "edges": graph_engine._G.number_of_edges()
        },
        "deployment": model_manager.get_status()
    }

@app.get("/metrics")
def get_metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/predict")
async def predict(req: PredictRequest):
    requests_total.labels(endpoint="predict").inc()

    # Features
    feats = feature_engineer.build(
        user_id=req.userId,
        amount=req.amount,
        location=req.location,
        device_id=req.deviceId,
        timestamp=req.timestamp,
    )

    # Update graph engine if context is provided
    if req.graphContext:
        graph_engine.update_graph(req.graphContext)
    
    # Get graph metrics for this specific user
    graph_metrics = graph_engine.get_node_metrics(req.userId)
    
    # Run prediction
    prediction = ensemble.predict(
        feats, 
        location=req.location, 
        device_id=req.deviceId, 
        graph_score=graph_metrics["graphScore"]
    )
    
    # Metrics tracking
    fraud_score_hist.observe(prediction.fraud_score)
    _recent_scores.append(prediction.fraud_score)
    
    return {
        "fraudScore": prediction.fraud_score,
        "isFraud": prediction.is_fraud,
        "confidence": prediction.confidence,
        "modelScores": prediction.model_scores,
        "modelWeights": prediction.model_weights,
        "explanations": prediction.explanations,
        "featureContributions": prediction.feature_contributions,
        "graphMetrics": graph_metrics,
        "modelVersion": model_manager.get_status()["active"]["version"]
    }

@app.get("/model/info")
async def get_model_info():
    info = ensemble.get_info()
    status = model_manager.get_status()
    
    # Enrichment
    models_list = []
    for model_meta in registry.all():
        models_list.append(model_meta)
        
    return {
        "models": models_list,
        "ensemble": info["ensemble"],
        "deployment": status
    }

@app.get("/model/registry")
async def get_model_registry(model_name: str = "xgboost"):
    """Returns historical run data from MLflow."""
    return registry.get_history(model_name)

@app.get("/model/stats")
async def get_model_stats():
    """Returns current active vs candidate status."""
    return model_manager.get_status()

@app.post("/model/retrain")
async def trigger_retrain(background_tasks: BackgroundTasks):
    """Manual trigger for retraining pipeline."""
    background_tasks.add_task(retraining_engine.run_pipeline)
    return {"message": "Retraining pipeline initiated", "status": "pending"}

@app.patch("/model/config")
def update_ensemble_config(payload: EnsembleConfigRequest) -> dict:
    if payload.weights:
        ensemble._weights.update(payload.weights)
    if payload.fraud_threshold is not None:
        ensemble._threshold = payload.fraud_threshold
    return {
        "weights": ensemble._weights,
        "fraud_threshold": ensemble._threshold,
    }

@app.get("/graph/analytics")
async def graph_analytics():
    return graph_engine.get_full_analytics()
