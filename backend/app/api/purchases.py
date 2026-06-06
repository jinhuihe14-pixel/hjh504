from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import date, timedelta

from app.models.schemas import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderListResponse,
    CreatePurchaseOrderRequest,
    UpdatePurchaseOrderStatusRequest,
    ArrivalConfirmationRequest,
    PurchaseOverview,
)
from app.services.purchase_service import PurchaseService
from app.services.purchase_service import (
    PURCHASE_STATUS_PENDING,
    PURCHASE_STATUS_ORDERED,
    PURCHASE_STATUS_DELIVERING,
    PURCHASE_STATUS_ARRIVED,
    PURCHASE_STATUS_CANCELLED,
)


router = APIRouter()

purchase_service = PurchaseService()


VALID_STATUSES = [
    PURCHASE_STATUS_PENDING,
    PURCHASE_STATUS_ORDERED,
    PURCHASE_STATUS_DELIVERING,
    PURCHASE_STATUS_ARRIVED,
    PURCHASE_STATUS_CANCELLED,
]


@router.get("", response_model=PurchaseOrderListResponse)
async def get_purchase_orders(
    status: Optional[str] = Query(None, description="状态筛选"),
    store_id: Optional[str] = Query(None, description="门店ID"),
    start_date: Optional[date] = Query(None, description="开始日期"),
    end_date: Optional[date] = Query(None, description="结束日期"),
):
    orders, total = purchase_service.get_purchase_orders(
        status=status,
        store_id=store_id,
        start_date=start_date,
        end_date=end_date,
    )
    return PurchaseOrderListResponse(total=total, items=orders)


@router.get("/{po_id}", response_model=PurchaseOrder)
async def get_purchase_order_detail(po_id: str):
    order = purchase_service.get_purchase_order_by_id(po_id)
    if not order:
        raise HTTPException(status_code=404, detail="采购单不存在")
    return order


@router.post("", response_model=PurchaseOrder)
async def create_purchase_order(request: CreatePurchaseOrderRequest):
    try:
        order = purchase_service.create_purchase_order(
            store_id=request.store_id,
            store_name=request.store_name,
            items=request.items,
            category=request.category or "",
            remark=request.remark or "",
        )
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{po_id}/status", response_model=PurchaseOrder)
async def update_purchase_order_status(
    po_id: str,
    request: UpdatePurchaseOrderStatusRequest,
):
    if request.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"无效的状态: {request.status}")

    order = purchase_service.update_status(po_id, request.status)
    if not order:
        raise HTTPException(status_code=404, detail="采购单不存在")
    return order


@router.post("/{po_id}/confirm-arrival", response_model=PurchaseOrder)
async def confirm_arrival(po_id: str, request: ArrivalConfirmationRequest):
    order = purchase_service.get_purchase_order_by_id(po_id)
    if not order:
        raise HTTPException(status_code=404, detail="采购单不存在")

    if order.status == PURCHASE_STATUS_ARRIVED:
        raise HTTPException(status_code=400, detail="该采购单已标记到货")

    if order.status == PURCHASE_STATUS_CANCELLED:
        raise HTTPException(status_code=400, detail="该采购单已取消")

    updated_order = purchase_service.confirm_arrival(
        po_id=po_id,
        arrival_items=[{"sku": item.sku, "actual_arrival": item.actual_arrival} for item in request.items],
    )
    if not updated_order:
        raise HTTPException(status_code=400, detail="到货确认失败")
    return updated_order


@router.get("/overview/stats", response_model=PurchaseOverview)
async def get_purchase_overview():
    return purchase_service.get_purchase_overview()
