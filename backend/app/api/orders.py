from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.schemas import Order, OrderCreate
from app.services.order_service import OrderService
from app.core.security import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])
_service = OrderService()


@router.get("", response_model=List[Order], summary="Lista pedidos / vendas")
def list_orders(
    status: Optional[str] = Query(None, description="Filtrar por status: ABERTO, FINALIZADO, CANCELADO"),
    limit: int = Query(100),
    _: dict = Depends(get_current_user),
):
    return _service.list_orders(status_filter=status, limit=limit)


@router.post("", response_model=Order, status_code=201, summary="Cria venda / pedido")
def create_order(data: OrderCreate, _: dict = Depends(get_current_user)):
    """
    Cria uma nova venda:
    - Deduz estoque de cada produto vendido
    - Cria registro em stock_movements (SAIDA) para auditoria
    - Status: FINALIZADO (à vista/cartão) ou ABERTO (a prazo)
    """
    return _service.create_order(data)


@router.get("/{order_id}", response_model=Order, summary="Busca pedido por ID")
def get_order(order_id: str, _: dict = Depends(get_current_user)):
    return _service.get_order(order_id)


@router.patch("/{order_id}/cancel", response_model=Order, summary="Cancela pedido")
def cancel_order(order_id: str, _: dict = Depends(get_current_user)):
    return _service.cancel_order(order_id)
