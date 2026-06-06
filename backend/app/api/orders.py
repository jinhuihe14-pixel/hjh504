from fastapi import APIRouter, HTTPException, Query
from typing import List
import random
from datetime import date, timedelta

from app.models.schemas import OrderSuggestionResponse, OrderSuggestionItem
from app.services.data_service import DataService
from app.ml.forecast_model import ForecastModel


router = APIRouter()

data_service = DataService()
forecast_model = ForecastModel(model_dir="data/models")


def train_model_if_needed(store_id: str, sku_name: str):
    try:
        forecast_model.predict(store_id, sku_name, future_days=1)
    except Exception:
        dates, quantities = data_service.get_sales_history(store_id, sku_name, days=180)
        if len(quantities) >= 7:
            forecast_model.train(store_id, sku_name, quantities, dates)


def calculate_order_suggestion(
    store_id: str,
    sku_name: str,
    product: dict,
) -> OrderSuggestionItem:
    try:
        train_model_if_needed(store_id, sku_name)
        result = forecast_model.predict(store_id, sku_name, future_days=7)
        forecast_demand = sum(result.predictions)
    except Exception:
        forecast_demand = random.uniform(30, 100)
    
    current_stock = round(random.uniform(5, 50), 2)
    safety_stock = round(forecast_demand * 0.3, 2)
    
    suggested_order = max(0, forecast_demand + safety_stock - current_stock)
    suggested_order = round(suggested_order, 2)
    
    if suggested_order > 0:
        if current_stock < safety_stock * 0.5:
            urgency = "紧急"
            reason = "库存低于安全线50%"
        elif current_stock < safety_stock:
            urgency = "较高"
            reason = "库存低于安全线"
        else:
            urgency = "正常"
            reason = "常规补货"
    else:
        urgency = "低"
        reason = "库存充足"
    
    return OrderSuggestionItem(
        sku=product["sku_id"],
        product_name=product["sku_name"],
        category=product["category"],
        current_stock=current_stock,
        safety_stock=safety_stock,
        forecast_demand=round(forecast_demand, 2),
        suggested_order=suggested_order,
        unit="个",
        order_reason=reason,
        urgency=urgency,
        price=float(product.get("unit_price", 0)),
        shelf_life_days=int(product.get("shelf_life_days", 0)),
    )


@router.get("/{store_id}", response_model=OrderSuggestionResponse)
async def get_order_suggestions(store_id: str):
    store = data_service.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail=f"门店 {store_id} 不存在")
    
    products = data_service.get_all_products()
    items = []
    
    for product in products:
        item = calculate_order_suggestion(store_id, product["sku_name"], product)
        items.append(item)
    
    items.sort(key=lambda x: x.suggested_order, reverse=True)
    
    total_value = sum(
        item.suggested_order * float(data_service.get_product_by_sku(item.sku)["unit_price"])
        for item in items
        if data_service.get_product_by_sku(item.sku)
    )
    
    return OrderSuggestionResponse(
        store_id=store_id,
        store_name=store.get("store_name", store_id),
        total_items=len(items),
        total_order_value=round(total_value, 2),
        items=items,
    )


@router.get("/category/{category}", response_model=OrderSuggestionResponse)
async def get_order_suggestions_by_category(
    category: str,
    store_id: str = Query("store_001", description="门店ID"),
):
    store = data_service.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail=f"门店 {store_id} 不存在")
    
    products = data_service.get_all_products(category)
    if not products:
        raise HTTPException(status_code=404, detail=f"品类 {category} 不存在")
    
    items = []
    for product in products:
        item = calculate_order_suggestion(store_id, product["sku_name"], product)
        items.append(item)
    
    items.sort(key=lambda x: x.suggested_order, reverse=True)
    
    total_value = sum(
        item.suggested_order * float(data_service.get_product_by_sku(item.sku)["unit_price"])
        for item in items
        if data_service.get_product_by_sku(item.sku)
    )
    
    return OrderSuggestionResponse(
        store_id=store_id,
        store_name=store.get("store_name", store_id),
        total_items=len(items),
        total_order_value=round(total_value, 2),
        items=items,
    )
