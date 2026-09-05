import logging

from config.supabase_client import supabase

logger = logging.getLogger(__name__)


def get_product_stock(product_id: str) -> int:
    """Retorna o saldo atual disponível de um produto somando entradas ativas."""
    if not supabase:
        return 0
    try:
        res = (
            supabase.table("entradas")
            .select("quantidade_atual")
            .eq("id_produto", product_id)
            .is_("deleted_at", "null")
            .gt("quantidade_atual", 0)
            .execute()
        )
        return sum(int(r.get("quantidade_atual", 0)) for r in (res.data or []))
    except Exception as e:
        logger.error(f"Erro ao obter estoque do produto {product_id}: {e}")
        return 0


def deduct_stock_fifo(product_id: str, quantity: int, venda_id: str | None = None, tipo: str = "VENDA") -> list[dict]:
    """
    Deduz o estoque de um produto utilizando estratégia FIFO (primeiro lote que entrou sai primeiro).
    Atualiza `quantidade_atual` na tabela `entradas` e insere registros na tabela `saidas`.
    Garante a invariante de que o estoque não pode ficar negativo.
    """
    if not supabase:
        raise RuntimeError("Supabase não configurado.")

    if quantity <= 0:
        return []

    # 1. Busca entradas ativas com saldo > 0 ordenadas por created_at ASC (FIFO)
    res = (
        supabase.table("entradas")
        .select("id, quantidade_atual, created_at")
        .eq("id_produto", product_id)
        .is_("deleted_at", "null")
        .gt("quantidade_atual", 0)
        .order("created_at", desc=False)
        .execute()
    )

    available_entries = res.data or []
    total_available = sum(int(e.get("quantidade_atual", 0)) for e in available_entries)

    if total_available < quantity:
        raise ValueError(
            f"Estoque insuficiente para o produto. Disponível: {total_available}, Solicitado: {quantity}"
        )

    remaining_needed = quantity
    created_saidas = []

    for entry in available_entries:
        if remaining_needed <= 0:
            break

        current_qty = int(entry.get("quantidade_atual", 0))
        to_deduct = min(current_qty, remaining_needed)
        new_qty = current_qty - to_deduct

        # Atualiza a entrada
        supabase.table("entradas").update({"quantidade_atual": new_qty}).eq("id", entry["id"]).execute()

        # Registra a saída correspondente
        saida_payload = {
            "id_entrada": entry["id"],
            "id_produto": product_id,
            "id_venda": venda_id,
            "tipo": tipo,
            "quantidade": to_deduct,
        }
        saida_res = supabase.table("saidas").insert(saida_payload).execute()
        if saida_res.data:
            created_saidas.append(saida_res.data[0])

        remaining_needed -= to_deduct

    return created_saidas
