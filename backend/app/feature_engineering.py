"""
连锁便利店智能订货系统 - 特征工程模块
包含时间特征、滞后特征、滚动特征、天气特征、促销特征、商品保质期特征、类别编码等
"""

import os
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from dateutil import parser as date_parser


class FeatureEngineer:
    """特征工程类，用于对销售数据进行特征提取和预处理"""
    
    def __init__(self, df: Optional[pd.DataFrame] = None):
        """
        初始化特征工程器
        
        Args:
            df: 输入的销售数据DataFrame
        """
        self.df: Optional[pd.DataFrame] = df
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.scalers: Dict[str, StandardScaler] = {}
    
    def load_data(self, data_path: str) -> pd.DataFrame:
        """
        从CSV文件加载数据
        
        Args:
            data_path: CSV文件路径
        
        Returns:
            加载的DataFrame
        """
        self.df = pd.read_csv(data_path)
        self.df["date"] = pd.to_datetime(self.df["date"])
        return self.df
    
    def create_time_features(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        创建时间特征：年、月、周、日、星期几、是否周末、是否节假日
        
        Args:
            df: 输入DataFrame，为None时使用self.df
        
        Returns:
            添加了时间特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        if "date" in df.columns:
            if df["date"].dtype != "datetime64[ns]":
                df["date"] = pd.to_datetime(df["date"])
        else:
            raise ValueError("DataFrame中缺少'date'列")
        
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month
        df["week"] = df["date"].dt.isocalendar().week.astype(int)
        df["day"] = df["date"].dt.day
        df["day_of_year"] = df["date"].dt.dayofyear
        df["weekday"] = df["date"].dt.weekday
        df["is_weekend"] = (df["weekday"] >= 5).astype(int)
        
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
        df["weekday_sin"] = np.sin(2 * np.pi * df["weekday"] / 7)
        df["weekday_cos"] = np.cos(2 * np.pi * df["weekday"] / 7)
        df["dayofyear_sin"] = np.sin(2 * np.pi * df["day_of_year"] / 365)
        df["dayofyear_cos"] = np.cos(2 * np.pi * df["day_of_year"] / 365)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_lag_features(
        self,
        df: Optional[pd.DataFrame] = None,
        lag_days: List[int] = [1, 3, 7, 14, 30],
        group_cols: List[str] = ["store_id", "sku"]
    ) -> pd.DataFrame:
        """
        创建滞后特征：前N天销量
        
        Args:
            df: 输入DataFrame，为None时使用self.df
            lag_days: 滞后天数列表
            group_cols: 分组列名列表
        
        Returns:
            添加了滞后特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        df = df.sort_values(group_cols + ["date"]).reset_index(drop=True)
        
        for lag in lag_days:
            col_name = f"sales_lag_{lag}"
            df[col_name] = df.groupby(group_cols)["sales_quantity"].shift(lag)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_rolling_features(
        self,
        df: Optional[pd.DataFrame] = None,
        windows: List[int] = [7, 14, 30],
        group_cols: List[str] = ["store_id", "sku"]
    ) -> pd.DataFrame:
        """
        创建滚动特征：移动平均、移动标准差
        
        Args:
            df: 输入DataFrame，为None时使用self.df
            windows: 滑动窗口大小列表
            group_cols: 分组列名列表
        
        Returns:
            添加了滚动特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        df = df.sort_values(group_cols + ["date"]).reset_index(drop=True)
        
        for window in windows:
            df[f"sales_rolling_mean_{window}"] = (
                df.groupby(group_cols)["sales_quantity"]
                .transform(lambda x: x.shift(1).rolling(window=window, min_periods=window // 2).mean())
            )
            df[f"sales_rolling_std_{window}"] = (
                df.groupby(group_cols)["sales_quantity"]
                .transform(lambda x: x.shift(1).rolling(window=window, min_periods=window // 2).std())
            )
            df[f"sales_rolling_max_{window}"] = (
                df.groupby(group_cols)["sales_quantity"]
                .transform(lambda x: x.shift(1).rolling(window=window, min_periods=window // 2).max())
            )
            df[f"sales_rolling_min_{window}"] = (
                df.groupby(group_cols)["sales_quantity"]
                .transform(lambda x: x.shift(1).rolling(window=window, min_periods=window // 2).min())
            )
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_weather_features(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        创建天气相关特征编码
        
        Args:
            df: 输入DataFrame，为None时使用self.df
        
        Returns:
            添加了天气特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        if "temperature" not in df.columns:
            print("警告：数据中缺少temperature列，跳过天气特征创建")
            return df
        
        df["temp_squared"] = df["temperature"] ** 2
        
        df["temp_category"] = pd.cut(
            df["temperature"],
            bins=[-np.inf, 5, 15, 25, 35, np.inf],
            labels=["寒冷", "凉爽", "温暖", "炎热", "酷热"]
        )
        
        df["is_hot"] = (df["temperature"] > 30).astype(int)
        df["is_cold"] = (df["temperature"] < 5).astype(int)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_promotion_features(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        创建促销特征
        
        Args:
            df: 输入DataFrame，为None时使用self.df
        
        Returns:
            添加了促销特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        if "is_promotion" not in df.columns:
            print("警告：数据中缺少is_promotion列，跳过促销特征创建")
            return df
        
        if "promotion_intensity" not in df.columns:
            df["promotion_intensity"] = 1.0 - df.get("discount_rate", 1.0)
        
        df["promo_price"] = df.get("unit_price", 0) * df.get("discount_rate", 1.0)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_shelf_life_features(self, df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        创建商品保质期特征
        
        Args:
            df: 输入DataFrame，为None时使用self.df
        
        Returns:
            添加了保质期特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        if "shelf_life_days" not in df.columns:
            print("警告：数据中缺少shelf_life_days列，跳过保质期特征创建")
            return df
        
        df["shelf_life_log"] = np.log1p(df["shelf_life_days"])
        
        df["shelf_life_category"] = pd.cut(
            df["shelf_life_days"],
            bins=[0, 7, 30, 90, 365, np.inf],
            labels=["极短保", "短保", "中保", "长保", "超长保"]
        )
        
        if "is_short_shelf" not in df.columns:
            df["is_short_shelf"] = (df["shelf_life_days"] <= 30).astype(int)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def encode_categorical_features(
        self,
        df: Optional[pd.DataFrame] = None,
        categorical_cols: Optional[List[str]] = None,
        method: str = "label"
    ) -> pd.DataFrame:
        """
        对类别特征进行编码
        
        Args:
            df: 输入DataFrame，为None时使用self.df
            categorical_cols: 类别特征列名列表
            method: 编码方法，'label'或'onehot'
        
        Returns:
            编码后的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        if categorical_cols is None:
            categorical_cols = ["store_id", "category", "sku", "community_activity", 
                                "temp_category", "shelf_life_category"]
        
        categorical_cols = [col for col in categorical_cols if col in df.columns]
        
        if method == "label":
            for col in categorical_cols:
                if col not in self.label_encoders:
                    le = LabelEncoder()
                    df[f"{col}_encoded"] = le.fit_transform(df[col].astype(str))
                    self.label_encoders[col] = le
                else:
                    le = self.label_encoders[col]
                    df[f"{col}_encoded"] = le.transform(df[col].astype(str))
        elif method == "onehot":
            df = pd.get_dummies(df, columns=categorical_cols, prefix=categorical_cols)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_target_encoding_features(
        self,
        df: Optional[pd.DataFrame] = None,
        group_cols: List[str] = ["store_id", "category", "sku"],
        target_col: str = "sales_quantity"
    ) -> pd.DataFrame:
        """
        创建目标编码特征（使用交叉验证方式避免泄露）
        
        Args:
            df: 输入DataFrame，为None时使用self.df
            group_cols: 分组列名列表
            target_col: 目标列名
        
        Returns:
            添加了目标编码特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        df = df.sort_values("date").reset_index(drop=True)
        
        for group_col in group_cols:
            if group_col not in df.columns:
                continue
            
            group_stats = df.groupby(group_col)[target_col].expanding().mean().reset_index(level=0, drop=True)
            df[f"{group_col}_target_mean"] = group_stats
            df[f"{group_col}_target_mean"] = df.groupby(group_col)[f"{group_col}_target_mean"].shift(1)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def scale_numerical_features(
        self,
        df: Optional[pd.DataFrame] = None,
        numerical_cols: Optional[List[str]] = None,
        fit: bool = True
    ) -> pd.DataFrame:
        """
        标准化数值特征
        
        Args:
            df: 输入DataFrame，为None时使用self.df
            numerical_cols: 数值特征列名列表
            fit: 是否拟合scaler
        
        Returns:
            标准化后的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        if numerical_cols is None:
            numerical_cols = [
                "temperature", "temp_squared", "shelf_life_days", "shelf_life_log",
                "promotion_intensity", "unit_price"
            ]
            numerical_cols += [col for col in df.columns if "lag_" in col or "rolling_" in col]
        
        numerical_cols = [col for col in numerical_cols if col in df.columns]
        
        if fit:
            for col in numerical_cols:
                scaler = StandardScaler()
                df[f"{col}_scaled"] = scaler.fit_transform(df[[col]].fillna(0))
                self.scalers[col] = scaler
        else:
            for col in numerical_cols:
                if col in self.scalers:
                    scaler = self.scalers[col]
                    df[f"{col}_scaled"] = scaler.transform(df[[col]].fillna(0))
        
        if self.df is not None and df is self.df:
            self.df = df
        
        return df
    
    def create_all_features(
        self,
        df: Optional[pd.DataFrame] = None,
        lag_days: List[int] = [1, 3, 7, 14, 30],
        rolling_windows: List[int] = [7, 14, 30],
        group_cols: List[str] = ["store_id", "sku"]
    ) -> pd.DataFrame:
        """
        创建所有特征的便捷方法
        
        Args:
            df: 输入DataFrame，为None时使用self.df
            lag_days: 滞后天数列表
            rolling_windows: 滑动窗口大小列表
            group_cols: 分组列名列表
        
        Returns:
            包含所有特征的DataFrame
        """
        if df is None:
            df = self.df.copy()
        else:
            df = df.copy()
        
        print("正在创建时间特征...")
        df = self.create_time_features(df)
        
        print("正在创建滞后特征...")
        df = self.create_lag_features(df, lag_days=lag_days, group_cols=group_cols)
        
        print("正在创建滚动特征...")
        df = self.create_rolling_features(df, windows=rolling_windows, group_cols=group_cols)
        
        print("正在创建天气特征...")
        df = self.create_weather_features(df)
        
        print("正在创建促销特征...")
        df = self.create_promotion_features(df)
        
        print("正在创建保质期特征...")
        df = self.create_shelf_life_features(df)
        
        print("正在编码类别特征...")
        df = self.encode_categorical_features(df, method="label")
        
        print("正在创建目标编码特征...")
        df = self.create_target_encoding_features(df, group_cols=group_cols)
        
        if self.df is not None and df is self.df:
            self.df = df
        
        print("特征工程完成！")
        return df
    
    def get_feature_columns(self, df: Optional[pd.DataFrame] = None) -> List[str]:
        """
        获取所有特征列名
        
        Args:
            df: 输入DataFrame，为None时使用self.df
        
        Returns:
            特征列名列表
        """
        if df is None:
            df = self.df
        
        if df is None:
            return []
        
        exclude_cols = ["date", "sales_quantity", "waste_quantity", "sales_amount", "waste_amount"]
        
        feature_cols = [
            col for col in df.columns 
            if col not in exclude_cols and df[col].dtype in ["int64", "float64", "int32", "float32"]
        ]
        
        return feature_cols
    
    def save_features(self, output_path: str, df: Optional[pd.DataFrame] = None) -> str:
        """
        保存特征数据到CSV文件
        
        Args:
            output_path: 输出文件路径
            df: 输入DataFrame，为None时使用self.df
        
        Returns:
            输出文件路径
        """
        if df is None:
            df = self.df
        
        if df is None:
            raise ValueError("没有数据可保存")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"特征数据已保存至: {output_path}")
        
        return output_path


def run_feature_engineering(
    input_path: str,
    output_path: Optional[str] = None,
    lag_days: List[int] = [1, 3, 7, 14, 30],
    rolling_windows: List[int] = [7, 14, 30]
) -> Tuple[pd.DataFrame, FeatureEngineer]:
    """
    运行完整的特征工程流程
    
    Args:
        input_path: 输入数据路径
        output_path: 输出数据路径，为None时自动生成
        lag_days: 滞后天数列表
        rolling_windows: 滑动窗口大小列表
    
    Returns:
        (处理后的DataFrame, FeatureEngineer实例)
    """
    print("=" * 60)
    print("连锁便利店智能订货系统 - 特征工程")
    print("=" * 60)
    
    engineer = FeatureEngineer()
    
    print(f"\n加载数据: {input_path}")
    engineer.load_data(input_path)
    print(f"数据形状: {engineer.df.shape}")
    
    print("\n开始特征工程...")
    df = engineer.create_all_features(
        lag_days=lag_days,
        rolling_windows=rolling_windows
    )
    
    print(f"\n处理后数据形状: {df.shape}")
    print(f"特征列数量: {len(engineer.get_feature_columns(df))}")
    
    if output_path:
        engineer.save_features(output_path, df)
    
    print("\n" + "=" * 60)
    print("特征工程完成！")
    print("=" * 60)
    
    return df, engineer


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    input_file = os.path.join(data_dir, "historical_sales_data.csv")
    output_file = os.path.join(data_dir, "feature_engineered_data.csv")
    
    if os.path.exists(input_file):
        run_feature_engineering(input_file, output_file)
    else:
        print(f"输入文件不存在: {input_file}")
        print("请先运行 data_generator.py 生成模拟数据")
