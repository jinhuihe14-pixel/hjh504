import os
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import date, timedelta
from pathlib import Path

from app.data_generator import (
    generate_all_data,
    generate_store_info,
    generate_sku_info,
    STORE_NAMES,
    CATEGORY_CONFIG,
)


class DataService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        base_dir = Path(__file__).parent.parent.parent
        self.data_dir = base_dir / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.sales_df: Optional[pd.DataFrame] = None
        self.stores_df: Optional[pd.DataFrame] = None
        self.skus_df: Optional[pd.DataFrame] = None

        self._load_or_generate_data()

    def _load_or_generate_data(self):
        sales_path = self.data_dir / "historical_sales_data.csv"
        stores_path = self.data_dir / "store_info.csv"
        skus_path = self.data_dir / "sku_info.csv"

        if not sales_path.exists() or not stores_path.exists() or not skus_path.exists():
            generate_all_data(output_dir=str(self.data_dir))
            generate_store_info(output_dir=str(self.data_dir))
            generate_sku_info(output_dir=str(self.data_dir))

        self.sales_df = pd.read_csv(sales_path)
        self.stores_df = pd.read_csv(stores_path)
        self.skus_df = pd.read_csv(skus_path)
        self.latest_date = date.fromisoformat(self.sales_df["date"].max())

    def get_all_stores(self) -> List[Dict]:
        if self.stores_df is None:
            return []
        return self.stores_df.to_dict("records")

    def get_store_by_id(self, store_id: str) -> Optional[Dict]:
        if self.stores_df is None:
            return None
        store = self.stores_df[self.stores_df["store_id"] == store_id]
        if store.empty:
            return None
        return store.iloc[0].to_dict()

    def get_all_products(self, category: Optional[str] = None) -> List[Dict]:
        if self.skus_df is None:
            return []
        df = self.skus_df
        if category:
            df = df[df["category"] == category]
        return df.to_dict("records")

    def get_product_by_sku(self, sku: str) -> Optional[Dict]:
        if self.skus_df is None:
            return None
        product = self.skus_df[self.skus_df["sku_name"] == sku]
        if product.empty:
            product = self.skus_df[self.skus_df["sku_id"] == sku]
        if product.empty:
            return None
        return product.iloc[0].to_dict()

    def get_sales_data(
        self,
        store_id: Optional[str] = None,
        sku: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pd.DataFrame:
        if self.sales_df is None:
            return pd.DataFrame()

        df = self.sales_df.copy()

        if store_id:
            df = df[df["store_id"] == store_id]
        if sku:
            df = df[df["sku"] == sku]
        if start_date:
            df = df[df["date"] >= start_date.strftime("%Y-%m-%d")]
        if end_date:
            df = df[df["date"] <= end_date.strftime("%Y-%m-%d")]

        return df

    def get_sales_history(self, store_id: str, sku: str, days: int = 90) -> Tuple[List[str], List[float]]:
        df = self.get_sales_data(store_id=store_id, sku=sku)
        if df.empty:
            return [], []

        df = df.sort_values("date").tail(days)
        dates = df["date"].tolist()
        quantities = df["sales_quantity"].astype(float).tolist()

        return dates, quantities

    def get_waste_data(
        self,
        store_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pd.DataFrame:
        df = self.get_sales_data(store_id=store_id, start_date=start_date, end_date=end_date)
        return df

    def get_dashboard_summary(self) -> Dict:
        if self.sales_df is None:
            return {}

        today = self.sales_df["date"].max()
        today_df = self.sales_df[self.sales_df["date"] == today]

        total_sales_amount = today_df["sales_amount"].sum()
        total_sales_qty = today_df["sales_quantity"].sum()

        total_sales_all = self.sales_df["sales_amount"].sum()
        total_waste_all = self.sales_df["waste_amount"].sum()
        waste_rate = total_waste_all / total_sales_all if total_sales_all > 0 else 0

        return {
            "total_stores": len(self.stores_df) if self.stores_df is not None else 0,
            "total_products": len(self.skus_df) if self.skus_df is not None else 0,
            "today_sales_amount": round(float(total_sales_amount), 2),
            "today_sales_quantity": int(total_sales_qty),
            "waste_rate": round(float(waste_rate), 4),
            "order_fulfillment_rate": 0.95,
            "forecast_accuracy": 0.88,
        }

    def get_categories(self) -> List[str]:
        if self.skus_df is None:
            return []
        return self.skus_df["category"].unique().tolist()

    def get_latest_date(self) -> date:
        return self.latest_date
