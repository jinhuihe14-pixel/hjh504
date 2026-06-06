from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.stores import router as stores_router
from app.api.products import router as products_router
from app.api.forecast import router as forecast_router
from app.api.orders import router as orders_router
from app.api.waste import router as waste_router
from app.api.dashboard import router as dashboard_router
from app.api.auth import router as auth_router
from app.services.data_service import DataService


app = FastAPI(
    title="连锁便利店智能订货系统 API",
    description="为连锁便利店提供智能订货、销量预测、损耗分析等功能的后端服务",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stores_router, prefix="/api/stores", tags=["门店管理"])
app.include_router(products_router, prefix="/api/products", tags=["商品管理"])
app.include_router(forecast_router, prefix="/api/forecast", tags=["销量预测"])
app.include_router(orders_router, prefix="/api/orders", tags=["订货建议"])
app.include_router(waste_router, prefix="/api/waste", tags=["损耗分析"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["仪表盘"])
app.include_router(auth_router, prefix="/api/auth", tags=["认证"])


@app.on_event("startup")
async def startup_event():
    data_service = DataService()
    _ = data_service.get_all_stores()
    _ = data_service.get_all_products()


@app.get("/")
async def root():
    return {
        "message": "连锁便利店智能订货系统 API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
