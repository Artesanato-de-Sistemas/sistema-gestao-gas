from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.schemas import Product, ProductCreate, ProductUpdate, StockMovement, StockMovementCreate
from app.services.product_service import ProductService
from app.core.security import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])
_service = ProductService()


@router.get("", response_model=List[Product], summary="Lista todos os produtos")
def list_products(
    active_only: bool = Query(False, description="Retorna apenas produtos ativos"),
    _: dict = Depends(get_current_user),
):
    return _service.list_products(active_only=active_only)


@router.post("", response_model=Product, status_code=201, summary="Cria um produto")
def create_product(data: ProductCreate, _: dict = Depends(get_current_user)):
    return _service.create_product(data)


@router.get("/{product_id}", response_model=Product, summary="Busca produto por ID")
def get_product(product_id: str, _: dict = Depends(get_current_user)):
    return _service.get_product(product_id)


@router.patch("/{product_id}", response_model=Product, summary="Atualiza produto")
def update_product(product_id: str, data: ProductUpdate, _: dict = Depends(get_current_user)):
    return _service.update_product(product_id, data)


# ── Stock Movements ──────────────────────────────────────────────────────────

@router.get(
    "/{product_id}/movements",
    response_model=List[StockMovement],
    summary="Histórico de movimentações de um produto",
)
def get_movements(product_id: str, limit: int = Query(50), _: dict = Depends(get_current_user)):
    return _service.list_movements(product_id=product_id, limit=limit)


@router.post(
    "/{product_id}/movements",
    response_model=StockMovement,
    status_code=201,
    summary="Registra movimentação de estoque",
)
def create_movement(
    product_id: str,
    data: StockMovementCreate,
    _: dict = Depends(get_current_user),
):
    data.product_id = product_id
    return _service.create_movement(data)
