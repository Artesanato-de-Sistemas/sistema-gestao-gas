from fastapi import APIRouter

from app.api import auth, products, inbounds, clients, orders, dashboard, stock, drivers

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(inbounds.router)
api_router.include_router(clients.router)
api_router.include_router(orders.router)
api_router.include_router(dashboard.router)
api_router.include_router(stock.router)
api_router.include_router(drivers.router)
