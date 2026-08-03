from typing import List
from fastapi import APIRouter, Depends
from app.schemas import Client, ClientCreate, ClientUpdate
from app.services.client_service import ClientService
from app.core.security import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])
_service = ClientService()


@router.get("", response_model=List[Client], summary="Lista clientes")
def list_clients(_: dict = Depends(get_current_user)):
    return _service.list_clients()


@router.post("", response_model=Client, status_code=201, summary="Cadastra cliente")
def create_client(data: ClientCreate, _: dict = Depends(get_current_user)):
    return _service.create_client(data)


@router.get("/{client_id}", response_model=Client, summary="Busca cliente por ID")
def get_client(client_id: str, _: dict = Depends(get_current_user)):
    return _service.get_client(client_id)


@router.patch("/{client_id}", response_model=Client, summary="Atualiza cliente")
def update_client(client_id: str, data: ClientUpdate, _: dict = Depends(get_current_user)):
    return _service.update_client(client_id, data)


@router.delete("/{client_id}", summary="Inativa cliente")
def delete_client(client_id: str, _: dict = Depends(get_current_user)):
    return _service.delete_client(client_id)
