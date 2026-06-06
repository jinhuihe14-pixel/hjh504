from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta
from typing import List
import pandas as pd

from app.models.schemas import (
    WasteAnalysisResponse,
    WasteAnalysisItem,
    HighRiskWasteResponse,
    HighRiskWasteItem,
    WeeklyComparisonResponse,
    WeeklyWasteData,
    ProductWasteDetailResponse,
    WeeklyTrendItem,
    WasteReasonItem,
)
from app.services.data_service import DataService


router = APIRouter()

data_service = DataService()

WASTE_REASONS = ["过期", "破损", "滞销"]


def _calculate_change_rate(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return round((current - previous) / previous, 4)


def _generate_reason_distribution(waste_amount: float, waste_rate: float) -> List[WasteReasonItem]:
    if waste_rate >= 0.15:
        ratios = [0.5, 0.3, 0.2]
    elif waste_rate >= 0.08:
        ratios = [0.35, 0.35, 0.3]
    else:
        ratios = [0.2, 0.3, 0.5]
    return [
        WasteReasonItem(name=WASTE_REASONS[i], value=round(waste_amount * ratios[i], 2))
        for i in range(3)
    ]


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


@router.get("/weekly-comparison", response_model=WeeklyComparisonResponse)
async def get_weekly_comparison(
    store_id: str = Query(None, description="门店ID，不传则查所有门店"),
):
    period_end = data_service.get_latest_date()

    this_week_start = period_end - timedelta(days=6)
    last_week_end = this_week_start - timedelta(days=1)
    last_week_start = last_week_end - timedelta(days=6)

    def _calc_week_data(start_date, end_date):
        df = data_service.get_waste_data(
            store_id=store_id,
            start_date=start_date,
            end_date=end_date,
        )
        if df.empty:
            return WeeklyWasteData(
                total_waste_amount=0.0,
                avg_waste_rate=0.0,
                high_risk_count=0,
            )

        total_waste = float(df["waste_amount"].sum())
        total_sales = float(df["sales_amount"].sum())
        waste_rate = total_waste / total_sales if total_sales > 0 else 0

        sku_groups = df.groupby(["sku"]).agg({
            "waste_amount": "sum",
            "sales_amount": "sum",
        }).reset_index()
        sku_groups["waste_rate"] = sku_groups.apply(
            lambda x: x["waste_amount"] / x["sales_amount"] if x["sales_amount"] > 0 else 0,
            axis=1,
        )
        high_risk_count = int((sku_groups["waste_rate"] >= 0.08).sum())

        return WeeklyWasteData(
            total_waste_amount=round(total_waste, 2),
            avg_waste_rate=round(waste_rate, 4),
            high_risk_count=high_risk_count,
        )

    this_week_data = _calc_week_data(this_week_start, period_end)
    last_week_data = _calc_week_data(last_week_start, last_week_end)

    amount_change = _calculate_change_rate(
        this_week_data.total_waste_amount,
        last_week_data.total_waste_amount,
    )
    rate_change = _calculate_change_rate(
        this_week_data.avg_waste_rate,
        last_week_data.avg_waste_rate,
    )
    risk_change = _calculate_change_rate(
        this_week_data.high_risk_count,
        last_week_data.high_risk_count,
    )

    return WeeklyComparisonResponse(
        this_week=this_week_data,
        last_week=last_week_data,
        amount_change_rate=amount_change,
        rate_change_rate=rate_change,
        risk_change_rate=risk_change,
    )


@router.get("/product-detail/{sku}", response_model=ProductWasteDetailResponse)
async def get_product_waste_detail(
    sku: str,
    store_id: str = Query(None, description="门店ID，不传则查所有门店"),
):
    period_end = data_service.get_latest_date()
    period_start = period_end - timedelta(days=27)

    df = data_service.get_waste_data(
        store_id=store_id,
        start_date=period_start,
        end_date=period_end,
    )
    df = df[df["sku"] == sku]

    if df.empty:
        return ProductWasteDetailResponse(
            sku=sku,
            product_name=sku,
            category="",
            weekly_trend=[],
            reason_distribution=[],
            suggestions=[],
        )

    df["date"] = pd.to_datetime(df["date"])
    df["week"] = df["date"].dt.isocalendar().week.astype(int)

    weekly_groups = df.groupby("week").agg({
        "waste_quantity": "sum",
        "waste_amount": "sum",
        "sales_amount": "sum",
    }).reset_index()
    weekly_groups = weekly_groups.sort_values("week")

    weekly_trend = []
    for _, row in weekly_groups.iterrows():
        waste_rate = (
            row["waste_amount"] / row["sales_amount"]
            if row["sales_amount"] > 0 else 0
        )
        weekly_trend.append(
            WeeklyTrendItem(
                week_label=f"第{int(row['week'])}周",
                waste_quantity=round(float(row["waste_quantity"]), 2),
                waste_amount=round(float(row["waste_amount"]), 2),
                waste_rate=round(float(waste_rate), 4),
            )
        )

    if len(weekly_trend) < 4:
        first_week_num = weekly_groups["week"].min() if not weekly_groups.empty else period_end.isocalendar()[1]
        while len(weekly_trend) < 4:
            first_week_num -= 1
            weekly_trend.insert(0, WeeklyTrendItem(
                week_label=f"第{first_week_num}周",
                waste_quantity=0.0,
                waste_amount=0.0,
                waste_rate=0.0,
            ))
    weekly_trend = weekly_trend[-4:]

    total_waste = float(df["waste_amount"].sum())
    total_sales = float(df["sales_amount"].sum())
    avg_waste_rate = total_waste / total_sales if total_sales > 0 else 0

    reason_distribution = _generate_reason_distribution(total_waste, avg_waste_rate)

    suggestions = []
    if avg_waste_rate >= 0.15:
        suggestions.append("损耗率极高，建议立即大幅减少订货量")
        suggestions.append("建议开展促销活动，加快库存周转")
    elif avg_waste_rate >= 0.08:
        suggestions.append("损耗率偏高，建议适当减少订货量")
        suggestions.append("建议优化安全库存设置")
    else:
        suggestions.append("损耗水平正常，建议持续监控")

    category = df["category"].iloc[0] if "category" in df.columns and not df.empty else ""

    return ProductWasteDetailResponse(
        sku=sku,
        product_name=sku,
        category=category,
        weekly_trend=weekly_trend,
        reason_distribution=reason_distribution,
        suggestions=suggestions,
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
