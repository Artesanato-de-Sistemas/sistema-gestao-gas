from typing import List
from fastapi import APIRouter, Depends, Query
from app.services.product_service import ProductService
from app.schemas import StockMovement
from app.core.security import get_current_user

router = APIRouter(prefix="/stock", tags=["Stock"])
_product_service = ProductService()


@router.get(
    "/movements",
    response_model=List[StockMovement],
    summary="Histórico global de movimentações",
)
def get_all_movements(
    limit: int = Query(50, description="Número máximo de registros"),
    _: dict = Depends(get_current_user),
):
    """Retorna o histórico global de movimentações de estoque (todas as entradas, saídas e ajustes)."""
    return _product_service.list_movements(limit=limit)
