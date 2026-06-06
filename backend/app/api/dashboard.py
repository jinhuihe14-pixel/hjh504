from fastapi import APIRouter
from datetime import date, timedelta
from typing import List
import pandas as pd

from app.models.schemas import (
    DashboardSummary,
    WeeklyReportResponse,
    WeeklySalesData,
    WeeklyCategoryData,
)
from app.services.data_service import DataService


router = APIRouter()

data_service = DataService()


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary():
    summary = data_service.get_dashboard_summary()
    return DashboardSummary(**summary)


@router.get("/weekly-report", response_model=WeeklyReportResponse)
async def get_weekly_report():
    period_end = data_service.get_latest_date()
    period_start = period_end - timedelta(days=6)
    
    df = data_service.get_sales_data(
        start_date=period_start,
        end_date=period_end,
    )
    
    if df.empty:
        return WeeklyReportResponse(
            period_start=period_start,
            period_end=period_end,
            total_sales_amount=0.0,
            total_sales_quantity=0,
            sales_growth_rate=0.0,
            waste_rate=0.0,
            waste_growth_rate=0.0,
            daily_sales=[],
            category_breakdown=[],
            top_products=[],
        )
    
    daily_df = df.groupby("date").agg({
        "sales_amount": "sum",
        "sales_quantity": "sum",
    }).reset_index()
    
    daily_sales = []
    for _, row in daily_df.iterrows():
        daily_sales.append(
            WeeklySalesData(
                date=date.fromisoformat(row["date"]),
                sales_amount=round(float(row["sales_amount"]), 2),
                sales_quantity=int(row["sales_quantity"]),
            )
        )
    
    total_sales = float(df["sales_amount"].sum())
    total_quantity = int(df["sales_quantity"].sum())
    
    cat_df = df.groupby("category").agg({
        "sales_amount": "sum",
        "sales_quantity": "sum",
    }).reset_index()
    
    category_breakdown = []
    for _, row in cat_df.iterrows():
        percentage = row["sales_amount"] / total_sales if total_sales > 0 else 0
        category_breakdown.append(
            WeeklyCategoryData(
                category=row["category"],
                sales_amount=round(float(row["sales_amount"]), 2),
                sales_quantity=int(row["sales_quantity"]),
                percentage=round(float(percentage), 4),
            )
        )
    
    category_breakdown.sort(key=lambda x: x.sales_amount, reverse=True)
    
    sku_df = df.groupby("sku").agg({
        "sales_amount": "sum",
        "sales_quantity": "sum",
    }).reset_index()
    sku_df = sku_df.sort_values("sales_amount", ascending=False).head(5)
    
    top_products = []
    for _, row in sku_df.iterrows():
        top_products.append({
            "sku": row["sku"],
            "name": row["sku"],
            "sales_amount": round(float(row["sales_amount"]), 2),
            "sales_quantity": int(row["sales_quantity"]),
        })
    
    total_waste = float(df["waste_amount"].sum())
    waste_rate = total_waste / total_sales if total_sales > 0 else 0
    
    return WeeklyReportResponse(
        period_start=period_start,
        period_end=period_end,
        total_sales_amount=round(total_sales, 2),
        total_sales_quantity=total_quantity,
        sales_growth_rate=0.05,
        waste_rate=round(waste_rate, 4),
        waste_growth_rate=-0.02,
        daily_sales=daily_sales,
        category_breakdown=category_breakdown,
        top_products=top_products,
    )
