from typing import List, Optional
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.schemas import Client, ClientCreate, ClientUpdate


class ClientService:
    """Manages clients with financial metrics in Supabase."""

    def list_clients(self) -> List[Client]:
        supabase = get_supabase()
        response = (
            supabase.table("clients")
            .select("*, persons(*)")
            .order("created_at", desc=True)
            .execute()
        )
        return [self._hydrate_client(raw) for raw in (response.data or [])]

    def get_client(self, client_id: str) -> Client:
        supabase = get_supabase()
        response = (
            supabase.table("clients")
            .select("*, persons(*)")
            .eq("id", client_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado."
            )
        return self._hydrate_client(response.data)

    def create_client(self, data: ClientCreate) -> Client:
        supabase = get_supabase()
        person_payload = {
            "name": data.name,
            "document": data.document,
            "phone": data.phone,
            "person_type": data.person_type,
            "trade_name": data.trade_name,
        }
        person_resp = supabase.table("persons").insert(person_payload).execute()
        if not person_resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar registro de pessoa.",
            )
        person_id = person_resp.data[0]["id"]
        client_payload = {
            "person_id": person_id,
            "payment_deadline_days": data.payment_deadline_days,
            "active": data.active,
        }
        client_resp = supabase.table("clients").insert(client_payload).execute()
        if not client_resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar cliente.",
            )
        return self.get_client(client_resp.data[0]["id"])

    def update_client(self, client_id: str, data: ClientUpdate) -> Client:
        supabase = get_supabase()
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        person_fields = {"name", "document", "phone", "person_type", "trade_name"}
        client_fields = {"payment_deadline_days", "active"}
        person_payload = {k: v for k, v in payload.items() if k in person_fields}
        client_payload = {k: v for k, v in payload.items() if k in client_fields}

        current_resp = (
            supabase.table("clients").select("person_id").eq("id", client_id).single().execute()
        )
        if not current_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")

        if person_payload:
            supabase.table("persons").update(person_payload).eq("id", current_resp.data["person_id"]).execute()
        if client_payload:
            supabase.table("clients").update(client_payload).eq("id", client_id).execute()

        return self.get_client(client_id)

    def delete_client(self, client_id: str) -> dict:
        supabase = get_supabase()
        supabase.table("clients").update({"active": False}).eq("id", client_id).execute()
        return {"message": "Cliente inativado com sucesso."}

    def _hydrate_client(self, raw: dict) -> Client:
        """Merges persons table data into the client schema."""
        person = raw.get("persons") or {}
        return Client(
            id=raw["id"],
            person_id=raw.get("person_id"),
            name=person.get("name", raw.get("name", "")),
            document=person.get("document", raw.get("document", "")),
            phone=person.get("phone", raw.get("phone")),
            person_type=person.get("person_type", raw.get("person_type", "FISICA")),
            trade_name=person.get("trade_name", raw.get("trade_name")),
            payment_deadline_days=raw.get("payment_deadline_days", 0),
            active=raw.get("active", True),
            created_at=raw.get("created_at"),
        )
