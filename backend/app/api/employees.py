from typing import List
from fastapi import APIRouter, Depends
from app.schemas import Employee, EmployeeCreate, EmployeeUpdate
from app.services.employee_service import EmployeeService
from app.core.security import get_current_user

router = APIRouter(prefix="/employees", tags=["Employees"])
_service = EmployeeService()


@router.get("", response_model=List[Employee], summary="Lista colaboradores")
def list_employees(_: dict = Depends(get_current_user)):
    return _service.list_employees()


@router.post("", response_model=Employee, status_code=201, summary="Cadastra colaborador")
def create_employee(data: EmployeeCreate, _: dict = Depends(get_current_user)):
    return _service.create_employee(data)


@router.get("/{employee_id}", response_model=Employee, summary="Busca colaborador por ID")
def get_employee(employee_id: str, _: dict = Depends(get_current_user)):
    return _service.get_employee(employee_id)


@router.patch("/{employee_id}", response_model=Employee, summary="Atualiza colaborador")
def update_employee(employee_id: str, data: EmployeeUpdate, _: dict = Depends(get_current_user)):
    return _service.update_employee(employee_id, data)


@router.delete("/{employee_id}", summary="Inativa colaborador (soft delete)")
def deactivate_employee(employee_id: str, _: dict = Depends(get_current_user)):
    return _service.deactivate_employee(employee_id)
