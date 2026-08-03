from typing import List, Optional, Literal
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.schemas import InboundPayload, InboundResponse, InboundItem

# Maps cylinder types to product name patterns
PRODUCT_TYPE_MAP = {
    "P13": "P13",
    "P20": "P20",
    "P45": "P45",
}


class InboundService:
    """
    Handles the Inbound (Entrada de Botijões) business logic.

    Business rules:
    - Each InboundItem maps to a product by type (P13, P20, P45)
    - The quantity received increments the product's stock_quantity
    - A stock_movement record is created for each item with type ENTRADA
    - The full inbound record is persisted in the 'inbounds' table
    """

    def create_inbound(self, payload: InboundPayload) -> InboundResponse:
        supabase = get_supabase()

        total_amount = sum(item.quantity * item.unitPrice for item in payload.items)

        # 1. Create the inbound header record
        inbound_data = {
            "truck_plate": payload.truckPlate,
            "invoice": payload.invoice,
            "total_amount": total_amount,
        }
        inbound_resp = supabase.table("inbounds").insert(inbound_data).execute()
        if not inbound_resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao registrar cabeçalho da entrada.",
            )
        inbound_id = inbound_resp.data[0]["id"]

        # 2. Process each item: insert inbound_items + stock movement
        items_to_insert = []
        for item in payload.items:
            items_to_insert.append({
                "inbound_id": inbound_id,
                "type": item.type,
                "condition": item.condition,
                "status": item.status,
                "quantity": item.quantity,
                "unit_price": item.unitPrice,
            })

        if items_to_insert:
            supabase.table("inbound_items").insert(items_to_insert).execute()

        # 3. Update stock for each product type
        for item in payload.items:
            if item.status == "OK":
                # Find the matching product
                prod_resp = supabase.table("products").select("id, stock_quantity").ilike(
                    "name", f"%{item.type}%"
                ).limit(1).execute()

                if prod_resp.data:
                    product = prod_resp.data[0]
                    new_qty = product["stock_quantity"] + item.quantity

                    # Update stock
                    supabase.table("products").update(
                        {"stock_quantity": new_qty}
                    ).eq("id", product["id"]).execute()

                    # Log stock movement
                    supabase.table("stock_movements").insert({
                        "product_id": product["id"],
                        "movement_type": "ENTRADA",
                        "quantity": item.quantity,
                        "notes": f"Entrada NF {payload.invoice} - Placa {payload.truckPlate}",
                    }).execute()

        return InboundResponse(
            id=inbound_id,
            truckPlate=payload.truckPlate,
            invoice=payload.invoice,
            total_amount=total_amount,
            created_at=inbound_resp.data[0].get("created_at"),
            items=payload.items,
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
