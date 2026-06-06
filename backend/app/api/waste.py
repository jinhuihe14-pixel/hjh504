from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import List
import pandas as pd

from app.models.schemas import (
    WasteAnalysisResponse,
    WasteAnalysisItem,
    HighRiskWasteResponse,
    HighRiskWasteItem,
)
from app.services.data_service import DataService


router = APIRouter()

data_service = DataService()


@router.get("/high-risk", response_model=HighRiskWasteResponse)
async def get_high_risk_products(
    threshold: float = Query(0.08, ge=0, le=1, description="损耗率阈值"),
    store_id: str = Query(None, description="门店ID，不传则查所有门店"),
):
    days = 30
    period_end = data_service.get_latest_date()
    period_start = period_end - timedelta(days=days)
    
    df = data_service.get_waste_data(
        store_id=store_id,
        start_date=period_start,
        end_date=period_end,
    )
    
    if df.empty:
        return HighRiskWasteResponse(total=0, items=[])
    
    group_cols = ["sku", "category"]
    sku_groups = df.groupby(group_cols).agg({
        "waste_quantity": "sum",
        "waste_amount": "sum",
        "sales_amount": "sum",
    }).reset_index()
    
    sku_groups["waste_rate"] = sku_groups.apply(
        lambda x: x["waste_amount"] / x["sales_amount"] if x["sales_amount"] > 0 else 0,
        axis=1,
    )
    
    high_risk = sku_groups[sku_groups["waste_rate"] >= threshold]
    
    items = []
    for _, row in high_risk.iterrows():
        waste_rate = float(row["waste_rate"])
        waste_amount = float(row["waste_amount"])
        
        if waste_rate >= 0.15:
            risk_level = "高"
            suggestion = "建议减少订货量，加强促销"
        elif waste_rate >= 0.1:
            risk_level = "中"
            suggestion = "建议关注库存，优化订货策略"
        else:
            risk_level = "低"
            suggestion = "建议持续监控"
        
        items.append(
            HighRiskWasteItem(
                sku=row["sku"],
                product_name=row["sku"],
                category=row["category"],
                waste_rate=round(waste_rate, 4),
                waste_amount=round(waste_amount, 2),
                risk_level=risk_level,
                suggestion=suggestion,
            )
        )
    
    items.sort(key=lambda x: x.waste_rate, reverse=True)
    
    return HighRiskWasteResponse(
        total=len(items),
        items=items,
    )


@router.get("/{store_id}", response_model=WasteAnalysisResponse)
async def get_waste_analysis(
    store_id: str,
    days: int = Query(30, ge=1, le=365, description="统计天数"),
):
    store = data_service.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail=f"门店 {store_id} 不存在")
    
    period_end = data_service.get_latest_date()
    period_start = period_end - timedelta(days=days)
    
    df = data_service.get_waste_data(
        store_id=store_id,
        start_date=period_start,
        end_date=period_end,
    )
    
    if df.empty:
        return WasteAnalysisResponse(
            store_id=store_id,
            store_name=store.get("store_name", store_id),
            period_start=period_start,
            period_end=period_end,
            total_waste_amount=0.0,
            total_waste_rate=0.0,
            items=[],
        )
    
    sku_groups = df.groupby(["sku", "category"]).agg({
        "waste_quantity": "sum",
        "waste_amount": "sum",
        "sales_amount": "sum",
    }).reset_index()
    
    sku_groups["waste_rate"] = sku_groups.apply(
        lambda x: x["waste_amount"] / x["sales_amount"] if x["sales_amount"] > 0 else 0,
        axis=1,
    )
    
    items = []
    for _, row in sku_groups.iterrows():
        waste_qty = float(row["waste_quantity"])
        waste_amount = float(row["waste_amount"])
        waste_rate = float(row["waste_rate"])
        
        if waste_rate > 0.1:
            reason = "过期损耗"
        elif waste_rate > 0.05:
            reason = "包装破损"
        else:
            reason = "其他"
        
        trend = "稳定"
        
        items.append(
            WasteAnalysisItem(
                sku=row["sku"],
                product_name=row["sku"],
                category=row["category"],
                waste_quantity=round(waste_qty, 2),
                waste_amount=round(waste_amount, 2),
                waste_rate=round(waste_rate, 4),
                waste_reason=reason,
                trend=trend,
            )
        )
    
    items.sort(key=lambda x: x.waste_amount, reverse=True)
    
    total_waste_amount = sum(item.waste_amount for item in items)
    total_sales_amount = float(df["sales_amount"].sum())
    avg_waste_rate = total_waste_amount / total_sales_amount if total_sales_amount > 0 else 0
    
    return WasteAnalysisResponse(
        store_id=store_id,
        store_name=store.get("store_name", store_id),
        period_start=period_start,
        period_end=period_end,
        total_waste_amount=round(total_waste_amount, 2),
        total_waste_rate=round(avg_waste_rate, 4),
        items=items,
    )
