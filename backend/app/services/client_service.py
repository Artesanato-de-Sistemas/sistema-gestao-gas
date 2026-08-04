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
        
        # Extract address if present
        address_data = None
        payload = data.model_dump(exclude={"address"})
        if data.address:
            address_data = data.address.model_dump()

        # Direct atomic insert into clients table
        response = supabase.table("clients").insert(payload).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar cliente.",
            )
        
        client_record = response.data[0]
        
        # If address exists, insert it
        if address_data:
            address_data["client_id"] = client_record["id"]
            addr_response = supabase.table("addresses").insert(address_data).execute()
            if addr_response.data:
                client_record["addresses"] = addr_response.data

        return Client(**client_record)

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
