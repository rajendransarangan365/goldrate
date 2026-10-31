"""
AURUM PULSE Local AI FastAPI Backend Server.
Provides local data ingestion status, dataset rebuild, model training, evaluation,
model registry management, inference, and AI explanation endpoints.
Binds to 127.0.0.1 (loopback) for security.
"""

import os
import json
import sqlite3
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.data_builder import build_dataset, TROY_OUNCE_GRAMS
from backend.trainer import (
    train_and_evaluate_model,
    activate_model,
    get_forecast,
    _load_registry,
    load_clean_data,
    REGISTRY_FILE
)

app = FastAPI(
    title="AURUM PULSE Local AI Service",
    description="Local quantitative modeling, dataset preparation, and inference engine for AURUM PULSE PWA.",
    version="1.0.0"
)

# Enable CORS for local dev server (port 5173) and local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrainRequest(BaseModel):
    model_type: str = "random_forest"
    horizon: int = 1

class ActivateRequest(BaseModel):
    model_version: str

@app.get("/")
def root():
    return {
        "service": "AURUM PULSE Local AI Service",
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/status")
def get_status():
    dataset_exists = os.path.exists("datasets/aurum_gold_training_dataset.csv")
    row_count = 0
    date_range = []
    if dataset_exists:
        try:
            df = pd.read_csv("datasets/aurum_gold_training_dataset.csv")
            row_count = len(df)
            if row_count > 0:
                date_range = [str(df['date'].iloc[0]), str(df['date'].iloc[-1])]
        except Exception:
            pass

    registry = _load_registry()
    active_model = registry.get("active_model")
    total_models = len(registry.get("models", []))

    return {
        "status": "online",
        "dataset_ready": dataset_exists,
        "row_count": row_count,
        "date_range": date_range,
        "active_model": active_model,
        "total_trained_models": total_models,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/dataset/summary")
def get_dataset_summary():
    if not os.path.exists("datasets/aurum_gold_training_dataset.csv"):
        raise HTTPException(status_code=404, detail="Dataset not generated yet. Call /api/dataset/rebuild.")
    
    df = pd.read_csv("datasets/aurum_gold_training_dataset.csv")
    latest = df.iloc[-1].to_dict()
    
    return {
        "total_rows": len(df),
        "start_date": str(df['date'].iloc[0]),
        "end_date": str(df['date'].iloc[-1]),
        "columns": df.columns.tolist(),
        "null_counts": df.isnull().sum().to_dict(),
        "latest_observation": {
            "date": str(latest['date']),
            "xau_usd_close": float(latest['xau_usd_close']),
            "usd_inr": float(latest['usd_inr']),
            "gold_inr_10g_theoretical": float(latest['gold_inr_10g_theoretical']),
            "gold_22k_theoretical": float(latest['gold_22k_theoretical']),
            "gold_18k_theoretical": float(latest['gold_18k_theoretical']),
            "sma_50": float(latest['sma_50']) if not pd.isna(latest['sma_50']) else None,
            "rsi_14": float(latest['rsi_14']) if not pd.isna(latest['rsi_14']) else None,
            "volatility_20d": float(latest['volatility_20d']) if not pd.isna(latest['volatility_20d']) else None
        }
    }

@app.post("/api/dataset/rebuild")
def rebuild_dataset_endpoint():
    try:
        _, meta = build_dataset()
        return {
            "message": "Dataset rebuilt successfully",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
def list_models():
    registry = _load_registry()
    return registry

@app.post("/api/models/train")
def train_model_endpoint(req: TrainRequest):
    try:
        record = train_and_evaluate_model(model_type=req.model_type, horizon=req.horizon)
        return {
            "message": f"Trained {req.model_type} for horizon {req.horizon}d successfully",
            "model_record": record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/models/activate")
def activate_model_endpoint(req: ActivateRequest):
    success = activate_model(req.model_version)
    if not success:
        raise HTTPException(status_code=404, detail="Model version not found in registry")
    return {"message": f"Activated model {req.model_version}", "active_model": req.model_version}

@app.get("/api/forecast")
def forecast_endpoint(horizon: int = Query(1, ge=1, le=5)):
    try:
        fc = get_forecast(horizon=horizon)
        return fc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(limit: int = Query(365, ge=10, le=7000)):
    if not os.path.exists("datasets/aurum_gold_training_dataset.csv"):
        raise HTTPException(status_code=404, detail="Dataset not ready")
    df = pd.read_csv("datasets/aurum_gold_training_dataset.csv")
    df_slice = df.tail(limit)
    records = df_slice[['date', 'xau_usd_close', 'usd_inr', 'gold_inr_10g_theoretical', 'gold_22k_theoretical', 'sma_7', 'sma_20', 'sma_50']].to_dict(orient='records')
    return {"count": len(records), "data": records}

@app.get("/api/explanation")
def get_explanation(horizon: int = Query(1, ge=1, le=5)):
    fc = get_forecast(horizon=horizon)
    direction = fc["predicted_direction"]
    ret_pct = fc["predicted_return_pct"]
    mae = fc["eval_metrics"]["mae_pct"]
    mae_inr = fc["eval_metrics"]["mae_inr_10g"]
    model_type = fc["model_type"]
    
    explanation_text = (
        f"The active model ({model_type}) projects a {direction.lower()} movement of "
        f"{abs(ret_pct):.2f}% over the next {horizon} trading day(s), estimating theoretical 24K gold at "
        f"INR {fc['predicted_theoretical_24k_10g']:,.2f} per 10g (expected interval: INR {fc['interval_low_24k_10g']:,.2f} "
        f"to INR {fc['interval_high_24k_10g']:,.2f}). Out-of-sample backtest validation on unseen historical "
        f"market data exhibits an average Mean Absolute Error (MAE) of {mae:.2f}% (approx +/- INR {mae_inr:.2f} per 10g). "
        f"Note that statistical momentum and moving average crossovers identify historical price association rather than "
        f"unforeseen geopolitical, monetary, or macroeconomic shocks."
    )
    
    return {
        "horizon": horizon,
        "model_type": model_type,
        "explanation": explanation_text,
        "caveat": "Estimates are strictly statistical baselines derived from historical observations. Never treat projections as guaranteed financial advice.",
        "forecast": fc
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

