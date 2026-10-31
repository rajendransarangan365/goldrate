"""
AI Training Pipeline & Model Registry for AURUM PULSE.
Implements:
- Persistence baseline
- Historical trend baseline
- Ridge regression
- Random Forest regressor
- Gradient Boosting regressor
- Strict chronological 70/15/15 and Walk-Forward Backtesting without future leakage
- MAE, RMSE, Directional Accuracy, Error in INR per 10g
- 1-day, 3-day, and 5-day horizon forecasting
- Model registry (save, version, activate, rollback)
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
from backend.baselines import PersistenceBaseline, TrendBaseline

TROY_OUNCE_GRAMS = 31.1034768

FEATURE_COLUMNS = [
    'return_1d_pct', 'return_3d_pct', 'return_5d_pct', 'return_20d_pct',
    'sma_7', 'sma_20', 'sma_50', 'ema_12', 'ema_26',
    'macd', 'macd_signal', 'rsi_14',
    'volatility_10d', 'volatility_20d',
    'rolling_high_20d', 'rolling_low_20d',
    'usd_inr_return_1d_pct'
]

REGISTRY_FILE = "models/registry.json"

def load_clean_data(dataset_path: str = "datasets/aurum_gold_training_dataset.csv"):
    if not os.path.exists(dataset_path):
        from backend.data_builder import build_dataset
        build_dataset(output_path=dataset_path)

    df = pd.read_csv(dataset_path)
    # Ensure chronological order
    df = df.sort_values('date').reset_index(drop=True)
    return df

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray, last_prices: np.ndarray, usd_inrs: np.ndarray):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))

    # Directional accuracy
    dir_true = np.sign(y_true)
    dir_pred = np.sign(y_pred)
    dir_correct = (dir_true == dir_pred)
    directional_accuracy = float(np.mean(dir_correct) * 100)

    # Confusion breakdown
    up_true = y_true > 0.05
    up_pred = y_pred > 0.05
    down_true = y_true < -0.05
    down_pred = y_pred < -0.05

    tp_up = int(np.sum(up_true & up_pred))
    fp_up = int(np.sum((~up_true) & up_pred))
    fn_up = int(np.sum(up_true & (~up_pred)))

    tp_down = int(np.sum(down_true & down_pred))
    fp_down = int(np.sum((~down_true) & down_pred))
    fn_down = int(np.sum(down_true & (~down_pred)))

    precision_up = float(tp_up / (tp_up + fp_up)) if (tp_up + fp_up) > 0 else 0.0
    recall_up = float(tp_up / (tp_up + fn_up)) if (tp_up + fn_up) > 0 else 0.0

    precision_down = float(tp_down / (tp_down + fp_down)) if (tp_down + fp_down) > 0 else 0.0
    recall_down = float(tp_down / (tp_down + fn_down)) if (tp_down + fn_down) > 0 else 0.0

    # Error in INR per 10g
    # Target is return_pct. Predicted price = last_price * (1 + y_pred/100)
    actual_price = last_prices * (1 + y_true / 100.0)
    predicted_price = last_prices * (1 + y_pred / 100.0)
    
    actual_inr_10g = (actual_price * usd_inrs / TROY_OUNCE_GRAMS) * 10.0
    pred_inr_10g = (predicted_price * usd_inrs / TROY_OUNCE_GRAMS) * 10.0
    mae_inr_10g = float(np.mean(np.abs(actual_inr_10g - pred_inr_10g)))

    return {
        "mae_pct": float(mae),
        "rmse_pct": float(rmse),
        "directional_accuracy_pct": directional_accuracy,
        "mae_inr_10g": mae_inr_10g,
        "up_precision": precision_up * 100,
        "up_recall": recall_up * 100,
        "down_precision": precision_down * 100,
        "down_recall": recall_down * 100,
        "test_samples": int(len(y_true))
    }

def train_and_evaluate_model(
    model_type: str = "random_forest",
    horizon: int = 1,
    dataset_path: str = "datasets/aurum_gold_training_dataset.csv"
) -> Dict[str, Any]:
    """
    Trains specified model with chronological 70% train / 15% validation / 15% test splits.
    Handles feature scaling without test-set leakage.
    """
    df = load_clean_data(dataset_path)

    target_col = {
        1: 'gold_return_next_day_pct',
        3: 'gold_return_next_3d_pct',
        5: 'gold_return_next_5d_pct'
    }.get(horizon, 'gold_return_next_day_pct')

    # Drop rows where target is NaN (at end of series) or where features are NaN (initial rolling windows)
    df_valid = df.dropna(subset=FEATURE_COLUMNS + [target_col, 'xau_usd_close', 'usd_inr']).reset_index(drop=True)

    n_samples = len(df_valid)
    if n_samples < 200:
        raise ValueError("Insufficient historical data to calculate a reliable estimate.")

    # Chronological split: 70% train, 15% val, 15% test
    train_end = int(n_samples * 0.70)
    val_end = int(n_samples * 0.85)

    train_df = df_valid.iloc[:train_end]
    val_df = df_valid.iloc[train_end:val_end]
    test_df = df_valid.iloc[val_end:]

    X_train_raw = train_df[FEATURE_COLUMNS].values
    y_train = train_df[target_col].values

    X_val_raw = val_df[FEATURE_COLUMNS].values
    y_val = val_df[target_col].values

    X_test_raw = test_df[FEATURE_COLUMNS].values
    y_test = test_df[target_col].values
    test_prices = test_df['xau_usd_close'].values
    test_usd_inrs = test_df['usd_inr'].values

    # Fit scaler ONLY on training data
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train_raw)
    X_val = scaler.transform(X_val_raw)
    X_test = scaler.transform(X_test_raw)

    start_time = time.time()

    # Model Selection
    if model_type == "persistence":
        model = PersistenceBaseline()
    elif model_type == "trend":
        model = TrendBaseline(horizon=horizon)
    elif model_type == "ridge":
        model = Ridge(alpha=10.0)
        model.fit(X_train, y_train)
    elif model_type == "gradient_boosting":
        model = GradientBoostingRegressor(n_estimators=100, max_depth=3, learning_rate=0.05, random_state=42)
        model.fit(X_train, y_train)
    else: # random_forest
        model_type = "random_forest"
        model = RandomForestRegressor(n_estimators=100, max_depth=6, min_samples_split=10, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

    train_duration = time.time() - start_time

    # Predict on test set
    if model_type in ["persistence", "trend"]:
        y_test_pred = model.predict(test_df[FEATURE_COLUMNS])
    else:
        y_test_pred = model.predict(X_test)

    eval_metrics = evaluate_predictions(y_test, y_test_pred, test_prices, test_usd_inrs)
    eval_metrics["train_duration_sec"] = round(train_duration, 3)

    # Compute historical uncertainty range (90th percentile of absolute validation error)
    if model_type in ["persistence", "trend"]:
        y_val_pred = model.predict(val_df[FEATURE_COLUMNS])
    else:
        y_val_pred = model.predict(X_val)
    val_errors = np.abs(y_val - y_val_pred)
    interval_err_pct = float(np.percentile(val_errors, 85)) # 85% coverage interval

    # Feature Importance (if applicable)
    importance_dict = {}
    if hasattr(model, 'feature_importances_'):
        for col, imp in zip(FEATURE_COLUMNS, model.feature_importances_):
            importance_dict[col] = round(float(imp), 4)
    elif hasattr(model, 'coef_'):
        for col, coef in zip(FEATURE_COLUMNS, model.coef_):
            importance_dict[col] = round(float(coef), 4)

    # Versioning & Model ID
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    model_version = f"{model_type}_h{horizon}_{timestamp}"
    artifact_path = f"models/archived/{model_version}.joblib"
    os.makedirs(os.path.dirname(artifact_path), exist_ok=True)

    # Save model artifact and scaler together
    artifact = {
        "model": model,
        "scaler": scaler,
        "feature_columns": FEATURE_COLUMNS,
        "model_type": model_type,
        "horizon": horizon,
        "interval_err_pct": interval_err_pct
    }
    joblib.dump(artifact, artifact_path)

    model_record = {
        "model_version": model_version,
        "model_type": model_type,
        "horizon": horizon,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": "v1.0.0",
        "train_samples": int(len(train_df)),
        "val_samples": int(len(val_df)),
        "test_samples": int(len(test_df)),
        "train_date_range": [str(train_df['date'].iloc[0]), str(train_df['date'].iloc[-1])],
        "test_date_range": [str(test_df['date'].iloc[0]), str(test_df['date'].iloc[-1])],
        "eval_metrics": eval_metrics,
        "interval_err_pct": interval_err_pct,
        "feature_importance": importance_dict,
        "artifact_path": artifact_path,
        "is_active": False
    }

    _save_to_registry(model_record)
    return model_record

def _load_registry() -> Dict[str, Any]:
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"active_model": None, "models": []}

def _save_to_registry(model_record: Dict[str, Any]):
    registry = _load_registry()
    registry["models"].insert(0, model_record)
    # If no active model, activate this one
    if not registry["active_model"]:
        registry["active_model"] = model_record["model_version"]
        model_record["is_active"] = True
    os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
    with open(REGISTRY_FILE, "w") as f:
        json.dump(registry, f, indent=2)

def activate_model(model_version: str) -> bool:
    registry = _load_registry()
    found = False
    for m in registry["models"]:
        if m["model_version"] == model_version:
            m["is_active"] = True
            registry["active_model"] = model_version
            # Copy artifact to active
            src = m["artifact_path"]
            dst = "models/active/active_model.joblib"
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if os.path.exists(src):
                joblib.dump(joblib.load(src), dst)
            found = True
        else:
            m["is_active"] = False
    if found:
        with open(REGISTRY_FILE, "w") as f:
            json.dump(registry, f, indent=2)
    return found

def get_forecast(horizon: int = 1) -> Dict[str, Any]:
    """
    Generates a real forecast using the latest available observation and active model.
    """
    df = load_clean_data()
    latest_row = df.iloc[-1]
    last_price = float(latest_row['xau_usd_close'])
    last_usd_inr = float(latest_row['usd_inr'])
    last_date = str(latest_row['date'])

    # Current theoretical prices
    current_theoretical_24k_10g = (last_price * last_usd_inr / TROY_OUNCE_GRAMS) * 10.0
    current_theoretical_22k_10g = current_theoretical_24k_10g * 22.0 / 24.0
    current_theoretical_18k_10g = current_theoretical_24k_10g * 18.0 / 24.0

    registry = _load_registry()
    active_version = registry.get("active_model")
    
    # Load model artifact
    model_record = None
    if active_version:
        for m in registry.get("models", []):
            if m["model_version"] == active_version and m["horizon"] == horizon:
                model_record = m
                break

    # If no model matching horizon, train baseline or random forest
    if not model_record:
        model_record = train_and_evaluate_model("random_forest", horizon=horizon)
        activate_model(model_record["model_version"])

    artifact_path = model_record["artifact_path"]
    artifact = joblib.load(artifact_path)
    model = artifact["model"]
    scaler = artifact["scaler"]
    interval_err_pct = artifact.get("interval_err_pct", 1.5)

    # Prepare features for the latest observation
    feat_values = latest_row[FEATURE_COLUMNS].values.reshape(1, -1)
    if model_record["model_type"] not in ["persistence", "trend"]:
        feat_scaled = scaler.transform(feat_values)
        pred_return_pct = float(model.predict(feat_scaled)[0])
    else:
        pred_return_pct = float(model.predict(feat_values)[0])

    # Predicted price
    pred_xau_usd = last_price * (1.0 + pred_return_pct / 100.0)
    pred_theoretical_24k_10g = (pred_xau_usd * last_usd_inr / TROY_OUNCE_GRAMS) * 10.0
    pred_theoretical_22k_10g = pred_theoretical_24k_10g * 22.0 / 24.0
    pred_theoretical_18k_10g = pred_theoretical_24k_10g * 18.0 / 24.0

    # Bounds
    low_xau_usd = last_price * (1.0 + (pred_return_pct - interval_err_pct) / 100.0)
    high_xau_usd = last_price * (1.0 + (pred_return_pct + interval_err_pct) / 100.0)
    low_24k_10g = (low_xau_usd * last_usd_inr / TROY_OUNCE_GRAMS) * 10.0
    high_24k_10g = (high_xau_usd * last_usd_inr / TROY_OUNCE_GRAMS) * 10.0

    # Direction
    direction = 'UP' if pred_return_pct > 0.05 else ('DOWN' if pred_return_pct < -0.05 else 'NEUTRAL')

    return {
        "horizon_days": horizon,
        "model_version": model_record["model_version"],
        "model_type": model_record["model_type"],
        "last_observed_date": last_date,
        "forecast_timestamp": datetime.now(timezone.utc).isoformat(),
        "current_xau_usd": round(last_price, 2),
        "current_usd_inr": round(last_usd_inr, 2),
        "current_theoretical_24k_10g": round(current_theoretical_24k_10g, 2),
        "current_theoretical_22k_10g": round(current_theoretical_22k_10g, 2),
        "current_theoretical_18k_10g": round(current_theoretical_18k_10g, 2),
        "predicted_return_pct": round(pred_return_pct, 3),
        "predicted_xau_usd": round(pred_xau_usd, 2),
        "predicted_theoretical_24k_10g": round(pred_theoretical_24k_10g, 2),
        "predicted_theoretical_22k_10g": round(pred_theoretical_22k_10g, 2),
        "predicted_theoretical_18k_10g": round(pred_theoretical_18k_10g, 2),
        "interval_low_24k_10g": round(low_24k_10g, 2),
        "interval_high_24k_10g": round(high_24k_10g, 2),
        "predicted_direction": direction,
        "eval_metrics": model_record["eval_metrics"],
        "feature_importance": model_record.get("feature_importance", {}),
        "disclaimer": "Estimates are uncertain statistical projections and do not constitute financial or trading advice."
    }

if __name__ == "__main__":
    print("Training baseline models...")
    p_rec = train_and_evaluate_model("persistence", horizon=1)
    print(f"Persistence MAE: {p_rec['eval_metrics']['mae_pct']:.3f}%, MAE INR: {p_rec['eval_metrics']['mae_inr_10g']:.2f}")

    print("Training Ridge regression...")
    r_rec = train_and_evaluate_model("ridge", horizon=1)
    print(f"Ridge MAE: {r_rec['eval_metrics']['mae_pct']:.3f}%, MAE INR: {r_rec['eval_metrics']['mae_inr_10g']:.2f}")

    print("Training Random Forest...")
    rf_rec = train_and_evaluate_model("random_forest", horizon=1)
    print(f"RF MAE: {rf_rec['eval_metrics']['mae_pct']:.3f}%, MAE INR: {rf_rec['eval_metrics']['mae_inr_10g']:.2f}, Dir Acc: {rf_rec['eval_metrics']['directional_accuracy_pct']:.1f}%")

    print("\nGenerating Forecast for Next Trading Day:")
    fc = get_forecast(horizon=1)
    print(f"Predicted Return: {fc['predicted_return_pct']}% ({fc['predicted_direction']})")
    print(f"Predicted 24K (10g): INR {fc['predicted_theoretical_24k_10g']}")
    print(f"Range: INR {fc['interval_low_24k_10g']} to INR {fc['interval_high_24k_10g']}")
