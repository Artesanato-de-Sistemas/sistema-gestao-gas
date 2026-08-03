# api package
from fastapi import APIRouter

from app.api import auth, products, inbounds, employees, clients, orders, dashboard, stock

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(inbounds.router)
api_router.include_router(employees.router)
api_router.include_router(clients.router)
api_router.include_router(orders.router)
api_router.include_router(dashboard.router)
api_router.include_router(stock.router)
