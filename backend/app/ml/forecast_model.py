import os
import json
import pickle
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from pathlib import Path
import math


@dataclass
class EvaluationMetrics:
    mae: float
    mape: float
    rmse: float
    model_name: str


@dataclass
class ForecastResult:
    predictions: List[float]
    dates: List[str]
    model_weights: Dict[str, float]
    metrics: Optional[EvaluationMetrics] = None


class SimpleExponentialSmoothing:
    def __init__(self, alpha: float = 0.3):
        self.alpha = alpha
        self.level: Optional[float] = None
        self.is_fitted: bool = False

    def fit(self, data: List[float]) -> None:
        if not data:
            raise ValueError("Data cannot be empty")
        self.level = data[0]
        for value in data[1:]:
            self.level = self.alpha * value + (1 - self.alpha) * self.level
        self.is_fitted = True

    def predict(self, steps: int) -> List[float]:
        if not self.is_fitted or self.level is None:
            raise ValueError("Model not fitted")
        return [self.level] * steps


class SeasonalDecomposition:
    def __init__(self, period: int = 7):
        self.period = period
        self.trend: List[float] = []
        self.seasonal: List[float] = []
        self.residual: List[float] = []
        self.is_fitted: bool = False

    def fit(self, data: List[float]) -> None:
        if len(data) < self.period * 2:
            raise ValueError(f"Data length must be at least {self.period * 2} for seasonal decomposition")

        n = len(data)
        trend = self._moving_average(data, self.period)
        detrended = [data[i] - trend[i] for i in range(n)]

        seasonal = []
        for i in range(self.period):
            indices = [j for j in range(i, n, self.period)]
            seasonal_values = [detrended[j] for j in indices]
            seasonal.append(sum(seasonal_values) / len(seasonal_values))

        seasonal_mean = sum(seasonal) / len(seasonal)
        seasonal = [s - seasonal_mean for s in seasonal]

        residual = [data[i] - trend[i] - seasonal[i % self.period] for i in range(n)]

        self.trend = trend
        self.seasonal = seasonal
        self.residual = residual
        self.is_fitted = True

    def predict(self, steps: int) -> List[float]:
        if not self.is_fitted:
            raise ValueError("Model not fitted")

        last_trend = self.trend[-1] if self.trend else 0
        if len(self.trend) >= 2:
            trend_slope = (self.trend[-1] - self.trend[-2])
        else:
            trend_slope = 0

        predictions = []
        for i in range(steps):
            trend_val = last_trend + trend_slope * (i + 1)
            seasonal_idx = (len(self.trend) + i) % self.period
            predictions.append(trend_val + self.seasonal[seasonal_idx])

        return predictions

    def _moving_average(self, data: List[float], window: int) -> List[float]:
        n = len(data)
        result = []
        half = window // 2

        for i in range(n):
            start = max(0, i - half)
            end = min(n, i + half + 1)
            result.append(sum(data[start:end]) / (end - start))

        return result


class LinearRegressionModel:
    def __init__(self):
        self.coefficients: List[float] = []
        self.intercept: float = 0.0
        self.feature_names: List[str] = []
        self.is_fitted: bool = False

    def fit(self, X: List[List[float]], y: List[float]) -> None:
        if not X or not y or len(X) != len(y):
            raise ValueError("Invalid training data")

        n_samples = len(X)
        n_features = len(X[0]) if X else 0

        X_with_intercept = [[1.0] + row for row in X]

        XtX = self._matrix_multiply(
            self._transpose(X_with_intercept), X_with_intercept
        )
        Xty = self._matrix_vector_multiply(
            self._transpose(X_with_intercept), y
        )

        try:
            XtX_inv = self._matrix_inverse(XtX)
            result = self._matrix_vector_multiply(XtX_inv, Xty)
            self.intercept = result[0]
            self.coefficients = result[1:]
            self.is_fitted = True
        except Exception:
            self.intercept = sum(y) / len(y) if y else 0.0
            self.coefficients = [0.0] * n_features
            self.is_fitted = True

    def predict(self, X: List[List[float]]) -> List[float]:
        if not self.is_fitted:
            raise ValueError("Model not fitted")

        predictions = []
        for row in X:
            pred = self.intercept
            for i, val in enumerate(row):
                if i < len(self.coefficients):
                    pred += self.coefficients[i] * val
            predictions.append(pred)

        return predictions

    def _transpose(self, matrix: List[List[float]]) -> List[List[float]]:
        if not matrix:
            return []
        n_rows = len(matrix)
        n_cols = len(matrix[0])
        return [[matrix[i][j] for i in range(n_rows)] for j in range(n_cols)]

    def _matrix_multiply(self, a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        if not a or not b:
            return []
        n_rows_a = len(a)
        n_cols_a = len(a[0])
        n_cols_b = len(b[0])

        result = [[0.0] * n_cols_b for _ in range(n_rows_a)]
        for i in range(n_rows_a):
            for j in range(n_cols_b):
                for k in range(n_cols_a):
                    result[i][j] += a[i][k] * b[k][j]
        return result

    def _matrix_vector_multiply(self, matrix: List[List[float]], vector: List[float]) -> List[float]:
        if not matrix or not vector:
            return []
        return [sum(m[i] * vector[i] for i in range(len(vector))) for m in matrix]

    def _matrix_inverse(self, matrix: List[List[float]]) -> List[List[float]]:
        n = len(matrix)
        augmented = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(matrix)]

        for i in range(n):
            if abs(augmented[i][i]) < 1e-10:
                for k in range(i + 1, n):
                    if abs(augmented[k][i]) > 1e-10:
                        augmented[i], augmented[k] = augmented[k], augmented[i]
                        break
                else:
                    raise ValueError("Matrix is singular")

            pivot = augmented[i][i]
            for j in range(2 * n):
                augmented[i][j] /= pivot

            for k in range(n):
                if k != i:
                    factor = augmented[k][i]
                    for j in range(2 * n):
                        augmented[k][j] -= factor * augmented[i][j]

        inverse = [row[n:] for row in augmented]
        return inverse


class ForecastModel:
    def __init__(self, model_dir: str = "data/models"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.models: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.model_weights: Dict[str, float] = {
            "ses": 0.3,
            "seasonal": 0.4,
            "linear": 0.3,
        }

    def _get_model_key(self, store_id: str, sku_id: str) -> str:
        return f"{store_id}_{sku_id}"

    def _extract_features(
        self,
        dates: List[str],
        history_data: List[float],
        future_features: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[List[List[float]], List[float]]:
        X = []
        y = []

        for i in range(len(history_data)):
            features = []

            date = datetime.strptime(dates[i], "%Y-%m-%d") if i < len(dates) else datetime.now()
            features.append(float(date.weekday()))
            features.append(float(date.month))
            features.append(1.0 if date.weekday() >= 5 else 0.0)

            if i >= 7:
                features.append(sum(history_data[i-7:i]) / 7)
            else:
                features.append(history_data[0] if history_data else 0.0)

            if i >= 1:
                features.append(history_data[i-1])
            else:
                features.append(history_data[0] if history_data else 0.0)

            features.append(float(i))

            X.append(features)
            y.append(history_data[i])

        return X, y

    def _generate_future_features(
        self,
        last_date: str,
        future_days: int,
        last_values: List[float],
        future_features: Optional[List[Dict[str, Any]]] = None,
    ) -> List[List[float]]:
        X_future = []
        base_date = datetime.strptime(last_date, "%Y-%m-%d")

        for i in range(future_days):
            features = []
            future_date = base_date + timedelta(days=i + 1)

            features.append(float(future_date.weekday()))
            features.append(float(future_date.month))
            features.append(1.0 if future_date.weekday() >= 5 else 0.0)

            if len(last_values) >= 7:
                features.append(sum(last_values[-7:]) / 7)
            else:
                features.append(last_values[-1] if last_values else 0.0)

            prev_val = last_values[-1] if last_values else 0.0
            if future_features and i < len(future_features):
                if "prev_day_sales" in future_features[i]:
                    prev_val = float(future_features[i]["prev_day_sales"])
            features.append(prev_val)

            features.append(float(len(last_values) + i))

            if future_features and i < len(future_features):
                ff = future_features[i]
                for key in ["promotion", "holiday", "temperature"]:
                    if key in ff:
                        features.append(float(ff[key]))

            X_future.append(features)

        return X_future

    def train(
        self,
        store_id: str,
        sku_id: str,
        history_data: List[float],
        dates: Optional[List[str]] = None,
    ) -> EvaluationMetrics:
        if not history_data or len(history_data) < 7:
            raise ValueError("History data must have at least 7 days of data")

        if dates is None:
            base_date = datetime.now() - timedelta(days=len(history_data))
            dates = [(base_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(len(history_data))]

        key = self._get_model_key(store_id, sku_id)

        train_size = int(len(history_data) * 0.8)
        train_data = history_data[:train_size]
        test_data = history_data[train_size:]
        train_dates = dates[:train_size]
        test_dates = dates[train_size:]

        ses_model = SimpleExponentialSmoothing(alpha=0.3)
        ses_model.fit(train_data)
        ses_pred = ses_model.predict(len(test_data))

        seasonal_model = SeasonalDecomposition(period=7)
        try:
            seasonal_model.fit(train_data)
            seasonal_pred = seasonal_model.predict(len(test_data))
        except ValueError:
            seasonal_pred = [train_data[-1]] * len(test_data) if train_data else [0.0] * len(test_data)

        X_train, y_train = self._extract_features(train_dates, train_data)
        linear_model = LinearRegressionModel()
        linear_model.fit(X_train, y_train)

        X_test, _ = self._extract_features(test_dates, test_data)
        linear_pred = linear_model.predict(X_test)

        weights = self._optimize_weights(ses_pred, seasonal_pred, linear_pred, test_data)

        combined_pred = self._weighted_average(
            [ses_pred, seasonal_pred, linear_pred],
            [weights["ses"], weights["seasonal"], weights["linear"]],
        )

        metrics = self._calculate_metrics(test_data, combined_pred, "ensemble")

        self.models[key] = {
            "ses": ses_model,
            "seasonal": seasonal_model,
            "linear": linear_model,
            "weights": weights,
            "last_date": dates[-1],
            "last_values": history_data[-14:],
            "metrics": metrics,
            "history_length": len(history_data),
        }

        self._save_model(key)

        return metrics

    def _optimize_weights(
        self,
        pred1: List[float],
        pred2: List[float],
        pred3: List[float],
        actual: List[float],
    ) -> Dict[str, float]:
        best_weights = {"ses": 0.33, "seasonal": 0.33, "linear": 0.34}
        best_mape = float("inf")

        for w1 in [0.1, 0.2, 0.3, 0.4, 0.5]:
            for w2 in [0.1, 0.2, 0.3, 0.4, 0.5]:
                w3 = 1.0 - w1 - w2
                if w3 < 0.1 or w3 > 0.5:
                    continue

                combined = self._weighted_average(
                    [pred1, pred2, pred3], [w1, w2, w3]
                )
                mape = self._calculate_mape(actual, combined)

                if mape < best_mape:
                    best_mape = mape
                    best_weights = {"ses": w1, "seasonal": w2, "linear": w3}

        return best_weights

    def _weighted_average(
        self, predictions: List[List[float]], weights: List[float]
    ) -> List[float]:
        n = len(predictions[0]) if predictions else 0
        result = []
        for i in range(n):
            total = 0.0
            weight_sum = 0.0
            for j, pred in enumerate(predictions):
                if i < len(pred):
                    total += pred[i] * weights[j]
                    weight_sum += weights[j]
            result.append(total / weight_sum if weight_sum > 0 else 0.0)
        return result

    def _calculate_mape(self, actual: List[float], predicted: List[float]) -> float:
        if not actual or not predicted:
            return 0.0

        errors = []
        for a, p in zip(actual, predicted):
            if abs(a) > 1e-6:
                errors.append(abs((a - p) / a))
            else:
                errors.append(abs(a - p))

        return sum(errors) / len(errors) * 100 if errors else 0.0

    def _calculate_metrics(
        self, actual: List[float], predicted: List[float], model_name: str
    ) -> EvaluationMetrics:
        if not actual or not predicted:
            return EvaluationMetrics(mae=0.0, mape=0.0, rmse=0.0, model_name=model_name)

        n = min(len(actual), len(predicted))
        abs_errors = [abs(actual[i] - predicted[i]) for i in range(n)]
        squared_errors = [(actual[i] - predicted[i]) ** 2 for i in range(n)]

        mae = sum(abs_errors) / n
        rmse = math.sqrt(sum(squared_errors) / n)
        mape = self._calculate_mape(actual[:n], predicted[:n])

        return EvaluationMetrics(mae=mae, mape=mape, rmse=rmse, model_name=model_name)

    def predict(
        self,
        store_id: str,
        sku_id: str,
        future_days: int = 7,
        future_features: Optional[List[Dict[str, Any]]] = None,
    ) -> ForecastResult:
        key = self._get_model_key(store_id, sku_id)

        if key not in self.models:
            self._load_model(key)

        if key not in self.models:
            raise ValueError(f"Model not found for store {store_id}, sku {sku_id}")

        model_data = self.models[key]
        ses_model: SimpleExponentialSmoothing = model_data["ses"]
        seasonal_model: SeasonalDecomposition = model_data["seasonal"]
        linear_model: LinearRegressionModel = model_data["linear"]
        weights: Dict[str, float] = model_data["weights"]
        last_date: str = model_data["last_date"]
        last_values: List[float] = model_data["last_values"]

        ses_pred = ses_model.predict(future_days)

        try:
            seasonal_pred = seasonal_model.predict(future_days)
        except Exception:
            seasonal_pred = [last_values[-1]] * future_days if last_values else [0.0] * future_days

        X_future = self._generate_future_features(
            last_date, future_days, last_values, future_features
        )
        linear_pred = linear_model.predict(X_future)

        combined_pred = self._weighted_average(
            [ses_pred, seasonal_pred, linear_pred],
            [weights["ses"], weights["seasonal"], weights["linear"]],
        )

        combined_pred = [max(0.0, p) for p in combined_pred]

        future_dates = []
        base_date = datetime.strptime(last_date, "%Y-%m-%d")
        for i in range(future_days):
            future_dates.append((base_date + timedelta(days=i + 1)).strftime("%Y-%m-%d"))

        return ForecastResult(
            predictions=combined_pred,
            dates=future_dates,
            model_weights=weights,
            metrics=model_data.get("metrics"),
        )

    def _get_model_path(self, key: str) -> Path:
        return self.model_dir / f"model_{key}.pkl"

    def _save_model(self, key: str) -> None:
        path = self._get_model_path(key)
        with open(path, "wb") as f:
            pickle.dump(self.models[key], f)

    def _load_model(self, key: str) -> bool:
        path = self._get_model_path(key)
        if not path.exists():
            return False

        try:
            with open(path, "rb") as f:
                self.models[key] = pickle.load(f)
            return True
        except Exception:
            return False

    def evaluate(
        self,
        store_id: str,
        sku_id: str,
        actual_data: List[float],
        predicted_data: List[float],
    ) -> EvaluationMetrics:
        return self._calculate_metrics(actual_data, predicted_data, f"{store_id}_{sku_id}")

    def list_models(self) -> List[Dict[str, Any]]:
        models_info = []
        for key, model_data in self.models.items():
            info = {
                "key": key,
                "history_length": model_data.get("history_length", 0),
                "metrics": model_data.get("metrics"),
            }
            models_info.append(info)

        for file_path in self.model_dir.glob("model_*.pkl"):
            key = file_path.stem.replace("model_", "")
            if key not in self.models:
                models_info.append({"key": key, "loaded": False})

        return models_info

    def delete_model(self, store_id: str, sku_id: str) -> bool:
        key = self._get_model_key(store_id, sku_id)

        if key in self.models:
            del self.models[key]

        path = self._get_model_path(key)
        if path.exists():
            path.unlink()
            return True

        return False
