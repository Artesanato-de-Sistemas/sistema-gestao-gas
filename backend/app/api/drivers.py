from typing import List
from fastapi import APIRouter, Depends
from app.schemas import Driver, DriverCreate, DriverUpdate
from app.services.driver_service import DriverService
from app.core.security import get_current_user

router = APIRouter(prefix="/drivers", tags=["Drivers"])
_service = DriverService()

@router.get("", response_model=List[Driver], summary="Lista entregadores")
def list_drivers(_: dict = Depends(get_current_user)):
    return _service.list_drivers()

@router.post("", response_model=Driver, status_code=201, summary="Cadastra entregador")
def create_driver(data: DriverCreate, _: dict = Depends(get_current_user)):
    return _service.create_driver(data)

@router.get("/{driver_id}", response_model=Driver, summary="Busca entregador por ID")
def get_driver(driver_id: str, _: dict = Depends(get_current_user)):
    return _service.get_driver(driver_id)

@router.patch("/{driver_id}", response_model=Driver, summary="Atualiza entregador")
def update_driver(driver_id: str, data: DriverUpdate, _: dict = Depends(get_current_user)):
    return _service.update_driver(driver_id, data)

@router.delete("/{driver_id}", summary="Inativa entregador (soft delete)")
def deactivate_driver(driver_id: str, _: dict = Depends(get_current_user)):
    return _service.deactivate_driver(driver_id)
