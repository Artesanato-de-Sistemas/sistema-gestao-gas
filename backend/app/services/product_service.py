from typing import List, Optional
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.schemas import (
    Product, ProductCreate, ProductUpdate,
    StockMovement, StockMovementCreate,
)


class ProductService:
    """Manages products and stock movements in Supabase."""

    # ── Products ─────────────────────────────────────────────────────────────

    def list_products(self, active_only: bool = False) -> List[Product]:
        supabase = get_supabase()
        query = supabase.table("products").select("*").order("name")
        if active_only:
            query = query.eq("active", True)
        response = query.execute()
        return [Product(**p) for p in (response.data or [])]

    def get_product(self, product_id: str) -> Product:
        supabase = get_supabase()
        response = supabase.table("products").select("*").eq("id", product_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
        return Product(**response.data)

    def create_product(self, data: ProductCreate) -> Product:
        supabase = get_supabase()
        response = supabase.table("products").insert(data.model_dump()).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao criar produto.")
        return Product(**response.data[0])

    def update_product(self, product_id: str, data: ProductUpdate) -> Product:
        supabase = get_supabase()
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        if not payload:
            return self.get_product(product_id)
        response = supabase.table("products").update(payload).eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")
        return Product(**response.data[0])

    # ── Stock Movements ───────────────────────────────────────────────────────

    def list_movements(self, product_id: Optional[str] = None, limit: int = 50) -> List[StockMovement]:
        supabase = get_supabase()
        query = supabase.table("stock_movements").select("*").order("created_at", desc=True).limit(limit)
        if product_id:
            query = query.eq("product_id", product_id)
        response = query.execute()
        return [StockMovement(**m) for m in (response.data or [])]

    def create_movement(self, data: StockMovementCreate) -> StockMovement:
        """
        Creates a stock movement and updates the product's stock_quantity.
        Uses Supabase RPC if available, otherwise manual update.
        """
        supabase = get_supabase()

        qty = data.quantity
        if data.movement_type == "SAIDA":
            qty = -abs(qty)
        elif data.movement_type == "ENTRADA":
            qty = abs(qty)
        # AJUSTE: keep as-is (can be negative)

        movement_payload = data.model_dump()
        movement_payload["quantity"] = qty
        mov_response = supabase.table("stock_movements").insert(movement_payload).execute()
        if not mov_response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao registrar movimentação.")

        # Update product stock
        try:
            supabase.rpc("increment_stock", {"p_product_id": data.product_id, "p_delta": qty}).execute()
        except Exception:
            prod_resp = supabase.table("products").select("stock_quantity").eq("id", data.product_id).single().execute()
            if prod_resp.data:
                new_qty = prod_resp.data["stock_quantity"] + qty
                supabase.table("products").update({"stock_quantity": new_qty}).eq("id", data.product_id).execute()

        return StockMovement(**mov_response.data[0])
