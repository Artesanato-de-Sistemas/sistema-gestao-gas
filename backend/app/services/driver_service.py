from typing import List, Optional
from fastapi import HTTPException, status
from app.core.database import get_supabase
from app.schemas import Driver, DriverCreate, DriverUpdate

class DriverService:
    """Manages delivery drivers."""

    def list_drivers(self, active_only: bool = False) -> List[Driver]:
        supabase = get_supabase()
        query = supabase.table("delivery_drivers").select("*").order("name")
        if active_only:
            query = query.eq("active", True)
        response = query.execute()
        return [Driver(**d) for d in (response.data or [])]

    def get_driver(self, driver_id: str) -> Driver:
        supabase = get_supabase()
        response = (
            supabase.table("delivery_drivers")
            .select("*")
            .eq("id", driver_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Entregador não encontrado."
            )
        return Driver(**response.data)

    def create_driver(self, data: DriverCreate) -> Driver:
        supabase = get_supabase()
        response = supabase.table("delivery_drivers").insert(data.model_dump()).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao cadastrar entregador.",
            )
        return Driver(**response.data[0])

    def update_driver(self, driver_id: str, data: DriverUpdate) -> Driver:
        supabase = get_supabase()
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        if not payload:
            return self.get_driver(driver_id)
        
        response = (
            supabase.table("delivery_drivers")
            .update(payload)
            .eq("id", driver_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Entregador não encontrado."
            )
        return Driver(**response.data[0])

    def deactivate_driver(self, driver_id: str) -> dict:
        supabase = get_supabase()
        supabase.table("delivery_drivers").update({"active": False}).eq("id", driver_id).execute()
        return {"message": "Entregador inativado com sucesso."}
