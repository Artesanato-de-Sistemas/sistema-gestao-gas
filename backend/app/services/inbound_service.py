from typing import List, Optional, Literal
from fastapi import HTTPException, status
from app.core.database import get_supabase
from app.schemas import InboundCreate, InboundResponse

class InboundService:
    def create_inbound(self, payload: InboundCreate) -> InboundResponse:
        supabase = get_supabase()

        total_amount = sum(item.quantity * item.unit_cost for item in payload.items)

        inbound_data = {
            "truck_plate": payload.truckPlate,
            "invoice_number": payload.invoice,
            "total_amount": total_amount,
            "status": "FINALIZADO"
        }
        inbound_resp = supabase.table("inbounds").insert(inbound_data).execute()
        if not inbound_resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao registrar cabeçalho da entrada.",
            )
        inbound_id = inbound_resp.data[0]["id"]

        items_to_insert = []
        for item in payload.items:
            items_to_insert.append({
                "inbound_id": inbound_id,
                "category": item.category,
                "quantity": item.quantity,
                "unit_cost": item.unit_cost,
                "available_quantity": item.quantity
            })

        if items_to_insert:
            supabase.table("inbound_items").insert(items_to_insert).execute()

        for item in payload.items:
            prod_resp = supabase.table("products").select("id, stock_quantity").eq(
                "category", item.category
            ).limit(1).execute()

            if prod_resp.data:
                product = prod_resp.data[0]
                new_qty = product["stock_quantity"] + item.quantity

                supabase.table("products").update(
                    {"stock_quantity": new_qty}
                ).eq("id", product["id"]).execute()

                supabase.table("stock_movements").insert({
                    "product_id": product["id"],
                    "movement_type": "ENTRADA",
                    "quantity": item.quantity,
                    "notes": f"Entrada NF {payload.invoice} - Placa {payload.truckPlate}",
                }).execute()

        return InboundResponse(
            id=inbound_id,
            truck_plate=payload.truckPlate,
            invoice_number=payload.invoice,
            total_amount=total_amount,
            status="FINALIZADO",
            created_at=inbound_resp.data[0].get("created_at"),
            items=[]
        )

    def list_inbounds(self, limit: int = 50) -> List[dict]:
        supabase = get_supabase()
        response = (
            supabase.table("inbounds")
            .select("*, inbound_items(*)")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
