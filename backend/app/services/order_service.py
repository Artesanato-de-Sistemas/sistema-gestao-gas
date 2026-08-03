from typing import List, Optional
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.schemas import Order, OrderCreate, OrderItem


class OrderService:
    """Manages sales orders with items and stock deductions."""

    def list_orders(
        self,
        status_filter: Optional[str] = None,
        limit: int = 100,
    ) -> List[Order]:
        supabase = get_supabase()
        query = (
            supabase.table("orders")
            .select(
                "*, clients(persons(name, trade_name)), employees(name), order_items(*, products(name))"
            )
            .order("created_at", desc=True)
            .limit(limit)
        )
        if status_filter:
            query = query.eq("status", status_filter)
        response = query.execute()
        return [self._hydrate_order(o) for o in (response.data or [])]

    def get_order(self, order_id: str) -> Order:
        supabase = get_supabase()
        response = (
            supabase.table("orders")
            .select(
                "*, clients(persons(name, trade_name)), employees(name), order_items(*, products(name))"
            )
            .eq("id", order_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado."
            )
        return self._hydrate_order(response.data)

    def create_order(self, data: OrderCreate) -> Order:
        supabase = get_supabase()

        total_amount = sum(item.quantity * item.unit_price for item in data.items)
        order_status = "ABERTO" if data.sale_type == "A PRAZO" else "FINALIZADO"

        order_payload = {
            "client_id": data.client_id,
            "delivery_driver_id": data.delivery_driver_id,
            "sale_type": data.sale_type,
            "status": order_status,
            "due_date": data.due_date,
            "total_amount": total_amount,
        }
        order_resp = supabase.table("orders").insert(order_payload).execute()
        if not order_resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar pedido.",
            )
        order_id = order_resp.data[0]["id"]

        # Insert order items and deduct stock
        items_payload = []
        for item in data.items:
            items_payload.append({
                "order_id": order_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.quantity * item.unit_price,
            })

            # Deduct from stock
            prod_resp = supabase.table("products").select("stock_quantity").eq(
                "id", item.product_id
            ).single().execute()
            if prod_resp.data:
                new_qty = max(0, prod_resp.data["stock_quantity"] - item.quantity)
                supabase.table("products").update({"stock_quantity": new_qty}).eq(
                    "id", item.product_id
                ).execute()

                # Log movement
                supabase.table("stock_movements").insert({
                    "product_id": item.product_id,
                    "movement_type": "SAIDA",
                    "quantity": -item.quantity,
                    "notes": f"Venda pedido #{order_id[:6].upper()}",
                }).execute()

        if items_payload:
            supabase.table("order_items").insert(items_payload).execute()

        return self.get_order(order_id)

    def cancel_order(self, order_id: str) -> Order:
        supabase = get_supabase()
        supabase.table("orders").update({"status": "CANCELADO"}).eq("id", order_id).execute()
        return self.get_order(order_id)

    def _hydrate_order(self, raw: dict) -> Order:
        """Flattens joined data into Order schema."""
        client_data = raw.get("clients") or {}
        person_data = client_data.get("persons") or {}
        driver_data = raw.get("employees") or {}
        raw_items = raw.get("order_items") or []

        items = []
        for i in raw_items:
            prod = i.get("products") or {}
            items.append(OrderItem(
                id=i["id"],
                order_id=i["order_id"],
                product_id=i["product_id"],
                product_name=prod.get("name"),
                quantity=i["quantity"],
                unit_price=i["unit_price"],
                subtotal=i["subtotal"],
            ))

        client_name = person_data.get("trade_name") or person_data.get("name")

        return Order(
            id=raw["id"],
            client_id=raw["client_id"],
            client_name=client_name,
            delivery_driver_id=raw.get("delivery_driver_id"),
            driver_name=driver_data.get("name"),
            sale_type=raw["sale_type"],
            status=raw["status"],
            due_date=raw.get("due_date"),
            total_amount=raw["total_amount"],
            created_at=raw.get("created_at"),
            items=items,
        )
