"""
Data Ingestion and Dataset Builder for AURUM PULSE.
Normalizes historical datasets, computes technical indicators without lookahead leakage,
and generates the standard training dataset.
"""

import os
import sqlite3
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

TROY_OUNCE_GRAMS = 31.1034768

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    # Exponential moving average for RSI
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    
    rs = avg_gain / (avg_loss + 1e-10)
    rsi = 100 - (100 / (1 + rs))
    return rsi

def build_dataset(
    commodity_path: str = "datasets/raw/commodity-prices.csv",
    gold_history_path: str = "datasets/raw/gold-price-history.csv",
    dexinus_path: str = "datasets/raw/DEXINUS.csv",
    output_path: str = "datasets/aurum_gold_training_dataset.csv",
    db_path: str = "backend/aurum_pulse.db"
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Builds the primary gold training dataset by merging gold prices and exchange rates.
    """
    # 1. Load Gold Data
    if os.path.exists(commodity_path):
        df_comm = pd.read_csv(commodity_path)
        gc = df_comm[df_comm['symbol'] == 'GC=F'].copy()
        gc['date'] = pd.to_datetime(gc['date'])
        gc = gc.rename(columns={
            'open': 'xau_usd_open',
            'high': 'xau_usd_high',
            'low': 'xau_usd_low',
            'close': 'xau_usd_close'
        })[['date', 'xau_usd_open', 'xau_usd_high', 'xau_usd_low', 'xau_usd_close']]
    elif os.path.exists(gold_history_path):
        gc = pd.read_csv(gold_history_path)
        gc['date'] = pd.to_datetime(gc['date'])
        gc = gc.rename(columns={'close_usd_per_oz': 'xau_usd_close'})
        gc['xau_usd_open'] = np.nan
        gc['xau_usd_high'] = np.nan
        gc['xau_usd_low'] = np.nan
    else:
        raise FileNotFoundError("No gold price dataset found in datasets/raw/")

    # Drop duplicate dates and sort
    gc = gc.drop_duplicates(subset=['date']).sort_values('date').reset_index(drop=True)

    # 2. Load USD/INR exchange rate (DEXINUS)
    if os.path.exists(dexinus_path):
        df_dex = pd.read_csv(dexinus_path)
        # FRED column observation_date / DEXINUS
        date_col = 'observation_date' if 'observation_date' in df_dex.columns else 'date'
        val_col = 'DEXINUS' if 'DEXINUS' in df_dex.columns else df_dex.columns[1]
        
        df_dex['date'] = pd.to_datetime(df_dex[date_col])
        df_dex['usd_inr'] = pd.to_numeric(df_dex[val_col], errors='coerce')
        df_dex = df_dex[['date', 'usd_inr']].dropna().drop_duplicates(subset=['date']).sort_values('date')
    else:
        # Fallback default historical USD/INR if file missing
        df_dex = pd.DataFrame({'date': gc['date'], 'usd_inr': 83.5})

    # Merge on date
    df = pd.merge(gc, df_dex, on='date', how='left')
    
    # Forward fill USD/INR for holidays or recent dates where gold traded but banks were closed
    df['usd_inr'] = df['usd_inr'].ffill().bfill()

    # 3. Compute Theoretical Indian Gold Prices
    # One troy ounce = 31.1034768 grams
    # Theoretical 24K INR per 10g: (xau_usd_close * usd_inr / 31.1034768) * 10
    df['gold_inr_10g_theoretical'] = (df['xau_usd_close'] * df['usd_inr'] / TROY_OUNCE_GRAMS) * 10
    df['gold_22k_theoretical'] = df['gold_inr_10g_theoretical'] * 22.0 / 24.0
    df['gold_18k_theoretical'] = df['gold_inr_10g_theoretical'] * 18.0 / 24.0

    # 4. Feature Preparation (Historical only, NO LOOKAHEAD LEAKAGE)
    df['return_1d_pct'] = df['xau_usd_close'].pct_change(1) * 100
    df['return_3d_pct'] = df['xau_usd_close'].pct_change(3) * 100
    df['return_5d_pct'] = df['xau_usd_close'].pct_change(5) * 100
    df['return_20d_pct'] = df['xau_usd_close'].pct_change(20) * 100
    df['usd_inr_return_1d_pct'] = df['usd_inr'].pct_change(1) * 100

    # Moving averages
    df['sma_7'] = df['xau_usd_close'].rolling(7).mean()
    df['sma_20'] = df['xau_usd_close'].rolling(20).mean()
    df['sma_50'] = df['xau_usd_close'].rolling(50).mean()

    # Exponential moving averages & MACD
    df['ema_12'] = df['xau_usd_close'].ewm(span=12, adjust=False).mean()
    df['ema_26'] = df['xau_usd_close'].ewm(span=26, adjust=False).mean()
    df['macd'] = df['ema_12'] - df['ema_26']
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()

    # RSI
    df['rsi_14'] = calculate_rsi(df['xau_usd_close'], period=14)

    # Volatility
    df['volatility_10d'] = df['return_1d_pct'].rolling(10).std()
    df['volatility_20d'] = df['return_1d_pct'].rolling(20).std()

    # Rolling highs & lows
    df['rolling_high_20d'] = df['xau_usd_close'].rolling(20).max()
    df['rolling_low_20d'] = df['xau_usd_close'].rolling(20).min()

    # 5. Future-return Targets (Shifted forward for supervised learning)
    df['gold_return_next_day_pct'] = (df['xau_usd_close'].shift(-1) - df['xau_usd_close']) / df['xau_usd_close'] * 100
    df['gold_return_next_3d_pct'] = (df['xau_usd_close'].shift(-3) - df['xau_usd_close']) / df['xau_usd_close'] * 100
    df['gold_return_next_5d_pct'] = (df['xau_usd_close'].shift(-5) - df['xau_usd_close']) / df['xau_usd_close'] * 100

    # Direction: UP (> +0.05%), DOWN (< -0.05%), NEUTRAL
    def get_direction(val):
        if pd.isna(val):
            return np.nan
        if val > 0.05:
            return 'UP'
        elif val < -0.05:
            return 'DOWN'
        return 'NEUTRAL'

    df['gold_direction_next_day'] = df['gold_return_next_day_pct'].apply(get_direction)

    # Format date as YYYY-MM-DD
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')

    # Save to CSV
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    # Save to SQLite
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    df.to_sql('market_observations', conn, if_exists='replace', index=False)
    conn.commit()
    conn.close()

    metadata = {
        "dataset_version": "v1.0.0",
        "row_count": len(df),
        "start_date": df['date'].iloc[0],
        "end_date": df['date'].iloc[-1],
        "latest_xau_usd": float(df['xau_usd_close'].iloc[-1]),
        "latest_usd_inr": float(df['usd_inr'].iloc[-1]),
        "latest_theoretical_24k_10g": float(df['gold_inr_10g_theoretical'].iloc[-1]),
        "missing_values_report": df.isnull().sum().to_dict()
    }
    return df, metadata

if __name__ == "__main__":
    df, meta = build_dataset()
    print("Dataset built successfully!")
    print(f"Total rows: {meta['row_count']}")
    print(f"Date range: {meta['start_date']} to {meta['end_date']}")
    print(f"Latest XAU/USD: ${meta['latest_xau_usd']}")
    print(f"Latest USD/INR: INR {meta['latest_usd_inr']}")
    print(f"Latest Theoretical 24K (10g): INR {meta['latest_theoretical_24k_10g']:.2f}")
