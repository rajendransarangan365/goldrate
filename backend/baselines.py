"""
Baseline models for financial time-series predictions.
Separated into dedicated module to ensure clean joblib/pickle serialization.
"""

import numpy as np
import pandas as pd

class PersistenceBaseline:
    """Predicts zero change (i.e. return = 0.0%)."""
    def __init__(self):
        self.name = "Persistence Baseline"

    def fit(self, X, y=None):
        return self

    def predict(self, X):
        return np.zeros(len(X))

class TrendBaseline:
    """Predicts future return based on recent momentum."""
    def __init__(self, horizon: int = 1):
        self.name = "Historical Trend Baseline"
        self.horizon = horizon

    def fit(self, X, y=None):
        return self

    def predict(self, X):
        if isinstance(X, pd.DataFrame):
            recent_ret = X['return_1d_pct'].values
        else:
            recent_ret = X[:, 0]
        return recent_ret * 0.5 * self.horizon

