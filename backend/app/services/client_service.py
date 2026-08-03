from typing import List, Optional
from fastapi import HTTPException, status
from app.core.database import get_supabase
from app.schemas import Client, ClientCreate, ClientUpdate

class ClientService:
    """Manages clients using the simplified, flattened clients table."""

    def list_clients(self) -> List[Client]:
        supabase = get_supabase()
        response = (
            supabase.table("clients")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return [Client(**raw) for raw in (response.data or [])]

    def get_client(self, client_id: str) -> Client:
        supabase = get_supabase()
        response = (
            supabase.table("clients")
            .select("*")
            .eq("id", client_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado."
            )
        return Client(**response.data)

    def create_client(self, data: ClientCreate) -> Client:
        supabase = get_supabase()
        # Direct atomic insert into clients table
        response = supabase.table("clients").insert(data.model_dump()).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar cliente.",
            )
        return Client(**response.data[0])

    def update_client(self, client_id: str, data: ClientUpdate) -> Client:
        supabase = get_supabase()
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        
        if not payload:
            return self.get_client(client_id)

        response = supabase.table("clients").update(payload).eq("id", client_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

        return Client(**response.data[0])

    def delete_client(self, client_id: str) -> dict:
        supabase = get_supabase()
        supabase.table("clients").update({"active": False}).eq("id", client_id).execute()
        return {"message": "Cliente inativado com sucesso."}
