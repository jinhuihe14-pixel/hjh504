from app.api.stores import router as stores_router
from app.api.products import router as products_router
from app.api.forecast import router as forecast_router
from app.api.orders import router as orders_router
from app.api.waste import router as waste_router
from app.api.dashboard import router as dashboard_router

__all__ = [
    "stores_router",
    "products_router",
    "forecast_router",
    "orders_router",
    "waste_router",
    "dashboard_router",
]
