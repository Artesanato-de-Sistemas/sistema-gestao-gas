from typing import List
from fastapi import APIRouter, Depends
from app.schemas import InboundPayload, InboundResponse
from app.services.inbound_service import InboundService
from app.core.security import get_current_user

router = APIRouter(prefix="/inbounds", tags=["Inbounds"])
_service = InboundService()


@router.get("", summary="Lista entradas de botijões")
def list_inbounds(_: dict = Depends(get_current_user)):
    """Retorna as últimas 50 entradas registradas, com itens aninhados."""
    return _service.list_inbounds()


@router.post(
    "",
    response_model=InboundResponse,
    status_code=201,
    summary="Registra uma entrada de botijões",
)
def create_inbound(payload: InboundPayload, _: dict = Depends(get_current_user)):
    """
    Registra o recebimento de botijões:
    - Persiste cabeçalho (placa, NF) e itens
    - Atualiza stock_quantity de cada produto
    - Cria registro em stock_movements para auditoria
    """
    return _service.create_inbound(payload)
