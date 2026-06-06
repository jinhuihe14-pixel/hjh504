from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    sku: str = Field(..., description="商品SKU编码")
    name: str = Field(..., description="商品名称")
    category: str = Field(..., description="商品品类")
    shelf_life_days: int = Field(..., description="保质期天数")
    unit: str = Field(..., description="单位")
    price: float = Field(..., description="售价")
    cost: float = Field(..., description="成本")


class Product(ProductBase):
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    total: int
    items: List[Product]


class StoreBase(BaseModel):
    store_id: str = Field(..., description="门店ID")
    name: str = Field(..., description="门店名称")
    address: str = Field(..., description="门店地址")
    city: str = Field(..., description="所在城市")
    area: float = Field(..., description="营业面积")
    manager: Optional[str] = Field(None, description="店长")
    phone: Optional[str] = Field(None, description="联系电话")


class Store(StoreBase):
    class Config:
        from_attributes = True


class StoreListResponse(BaseModel):
    total: int
    items: List[Store]


class SalesData(BaseModel):
    sku: str
    date: date
    quantity: int
    amount: float


class ForecastItem(BaseModel):
    date: date
    predicted_quantity: float
    lower_bound: float
    upper_bound: float
    confidence: float


class ForecastRequest(BaseModel):
    store_id: str
    sku: str
    days_ahead: int = Field(default=7, ge=1, le=30)


class ForecastResponse(BaseModel):
    store_id: str
    sku: str
    product_name: str
    forecast_days: int
    items: List[ForecastItem]


class BatchForecastRequest(BaseModel):
    store_id: str
    skus: List[str]
    days_ahead: int = Field(default=7, ge=1, le=30)


class BatchForecastResponse(BaseModel):
    store_id: str
    forecast_days: int
    results: List[ForecastResponse]


class OrderSuggestionItem(BaseModel):
    sku: str
    product_name: str
    category: str
    current_stock: float
    safety_stock: float
    forecast_demand: float
    suggested_order: float
    unit: str
    order_reason: str
    urgency: str
    price: float = 0.0
    shelf_life_days: int = 0


class OrderSuggestionResponse(BaseModel):
    store_id: str
    store_name: str
    total_items: int
    total_order_value: float
    items: List[OrderSuggestionItem]


class WasteAnalysisItem(BaseModel):
    sku: str
    product_name: str
    category: str
    waste_quantity: float
    waste_amount: float
    waste_rate: float
    waste_reason: str
    trend: str


class WasteAnalysisResponse(BaseModel):
    store_id: str
    store_name: str
    period_start: date
    period_end: date
    total_waste_amount: float
    total_waste_rate: float
    items: List[WasteAnalysisItem]


class HighRiskWasteItem(BaseModel):
    sku: str
    product_name: str
    category: str
    waste_rate: float
    waste_amount: float
    risk_level: str
    suggestion: str


class HighRiskWasteResponse(BaseModel):
    total: int
    items: List[HighRiskWasteItem]


class DashboardSummary(BaseModel):
    total_stores: int
    total_products: int
    today_sales_amount: float
    today_sales_quantity: int
    waste_rate: float
    order_fulfillment_rate: float
    forecast_accuracy: float


class WeeklySalesData(BaseModel):
    date: date
    sales_amount: float
    sales_quantity: int


class WeeklyCategoryData(BaseModel):
    category: str
    sales_amount: float
    sales_quantity: int
    percentage: float


class WeeklyReportResponse(BaseModel):
    period_start: date
    period_end: date
    total_sales_amount: float
    total_sales_quantity: int
    sales_growth_rate: float
    waste_rate: float
    waste_growth_rate: float
    daily_sales: List[WeeklySalesData]
    category_breakdown: List[WeeklyCategoryData]
    top_products: List[Dict[str, Any]]


class ApiResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None


class PurchaseOrderItem(BaseModel):
    sku: str
    product_name: str
    category: str
    suggested_order: float
    adjusted_order: float
    actual_arrival: Optional[float] = 0.0
    unit: str
    price: float
    amount: float
    adjust_reason: Optional[str] = ""
    is_adjusted: Optional[bool] = False


class PurchaseOrder(BaseModel):
    id: str
    po_no: str
    store_id: str
    store_name: str
    supplier: str
    category: Optional[str] = ""
    total_amount: float
    total_quantity: float
    estimated_arrival_date: date
    status: str
    remark: Optional[str] = ""
    items: List[PurchaseOrderItem]
    created_at: datetime
    updated_at: datetime


class CreatePurchaseOrderRequest(BaseModel):
    store_id: str
    store_name: str
    category: Optional[str] = ""
    items: List[PurchaseOrderItem]
    remark: Optional[str] = ""


class PurchaseOrderListResponse(BaseModel):
    total: int
    items: List[PurchaseOrder]


class UpdatePurchaseOrderStatusRequest(BaseModel):
    status: str


class ArrivalItem(BaseModel):
    sku: str
    actual_arrival: float


class ArrivalConfirmationRequest(BaseModel):
    items: List[ArrivalItem]


class PurchaseOverview(BaseModel):
    pending_confirm_count: int
    in_delivery_count: int
    monthly_total_amount: float
    average_arrival_rate: float


class StockInRecord(BaseModel):
    id: str
    po_no: str
    sku: str
    product_name: str
    quantity: float
    unit: str
    price: float
    amount: float
    store_id: str
    created_at: datetime
