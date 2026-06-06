from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models.schemas import Product, ProductListResponse
from app.services.data_service import DataService


router = APIRouter()

data_service = DataService()


@router.get("", response_model=ProductListResponse)
async def get_products(
    category: Optional[str] = Query(None, description="按品类筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    products_data = data_service.get_all_products(category)
    
    total = len(products_data)
    items_data = products_data[skip : skip + limit]
    
    items = []
    for p in items_data:
        items.append(
            Product(
                sku=p["sku_id"],
                name=p["sku_name"],
                category=p["category"],
                shelf_life_days=int(p["shelf_life_days"]),
                unit="个",
                price=float(p["unit_price"]),
                cost=float(p["unit_price"]) * 0.6,
            )
        )
    
    return ProductListResponse(
        total=total,
        items=items,
    )


@router.get("/{sku}", response_model=Product)
async def get_product(sku: str):
    product_data = data_service.get_product_by_sku(sku)
    if not product_data:
        raise HTTPException(status_code=404, detail=f"商品 {sku} 不存在")
    
    return Product(
        sku=product_data["sku_id"],
        name=product_data["sku_name"],
        category=product_data["category"],
        shelf_life_days=int(product_data["shelf_life_days"]),
        unit="个",
        price=float(product_data["unit_price"]),
        cost=float(product_data["unit_price"]) * 0.6,
    )
