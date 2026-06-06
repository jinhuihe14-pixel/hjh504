from fastapi import APIRouter, HTTPException
from typing import List

from app.models.schemas import Store, StoreListResponse
from app.services.data_service import DataService


router = APIRouter()

data_service = DataService()


@router.get("", response_model=StoreListResponse)
async def get_stores():
    stores_data = data_service.get_all_stores()
    stores = []
    for s in stores_data:
        stores.append(
            Store(
                store_id=s["store_id"],
                name=s.get("store_name", s["store_id"]),
                address="",
                city="",
                area=float(s.get("area", 0)),
                manager=None,
                phone=None,
            )
        )
    return StoreListResponse(
        total=len(stores),
        items=stores,
    )


@router.get("/{store_id}", response_model=Store)
async def get_store(store_id: str):
    store_data = data_service.get_store_by_id(store_id)
    if not store_data:
        raise HTTPException(status_code=404, detail=f"门店 {store_id} 不存在")
    
    return Store(
        store_id=store_data["store_id"],
        name=store_data.get("store_name", store_data["store_id"]),
        address="",
        city="",
        area=float(store_data.get("area", 0)),
        manager=None,
        phone=None,
    )
