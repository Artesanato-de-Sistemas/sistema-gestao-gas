from typing import List, Optional
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.schemas import Employee, EmployeeCreate, EmployeeUpdate


class EmployeeService:
    """Manages employees (Entregadores and Secretários) in Supabase."""

    def list_employees(self, active_only: bool = False) -> List[Employee]:
        supabase = get_supabase()
        query = supabase.table("employees").select("*").order("name")
        if active_only:
            query = query.eq("active", True)
        response = query.execute()
        return [Employee(**e) for e in (response.data or [])]

    def get_employee(self, employee_id: str) -> Employee:
        supabase = get_supabase()
        response = (
            supabase.table("employees")
            .select("*")
            .eq("id", employee_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado."
            )
        return Employee(**response.data)

    def create_employee(self, data: EmployeeCreate) -> Employee:
        supabase = get_supabase()
        response = supabase.table("employees").insert(data.model_dump()).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao cadastrar colaborador.",
            )
        return Employee(**response.data[0])

    def update_employee(self, employee_id: str, data: EmployeeUpdate) -> Employee:
        supabase = get_supabase()
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        if not payload:
            return self.get_employee(employee_id)
        response = (
            supabase.table("employees").update(payload).eq("id", employee_id).execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Colaborador não encontrado."
            )
        return Employee(**response.data[0])

    def deactivate_employee(self, employee_id: str) -> Employee:
        """Soft-deletes by setting active=False (preserves history)."""
        return self.update_employee(employee_id, EmployeeUpdate(active=False))
