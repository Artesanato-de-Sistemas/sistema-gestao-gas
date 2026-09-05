import logging

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response

from config.permissions import IsAdmin, IsColaborador
from config.supabase_client import SupabaseViewSet, supabase

from .services import deduct_stock_fifo

logger = logging.getLogger(__name__)


class ProdutoViewSet(SupabaseViewSet):
    table_name = "produtos"

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsColaborador()]
        return [IsAdmin()]

    def list(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            # 1. Busca produtos
            prods_res = (
                supabase.table("produtos")
                .select("*")
                .eq("ativo", True)
                .order("nome")
                .execute()
            )
            products = prods_res.data or []

            # 2. Busca estoque atual por produto através das entradas ativas
            entries_res = (
                supabase.table("entradas")
                .select("id_produto, quantidade_atual")
                .is_("deleted_at", "null")
                .gt("quantidade_atual", 0)
                .execute()
            )
            stock_map = {}
            for e in (entries_res.data or []):
                pid = str(e.get("id_produto"))
                stock_map[pid] = stock_map.get(pid, 0) + int(e.get("quantidade_atual") or 0)

            # Enriquecendo com quantidade_disponivel e compatibilidade com campos legados
            for p in products:
                pid = str(p["id"])
                qty = stock_map.get(pid, 0)
                p["quantidade_disponivel"] = qty
                p["stock_quantity"] = qty
                p["current_price"] = float(p.get("valor_padrao") or 0)
                p["name"] = p.get("nome")

            return Response(products)
        except Exception as e:
            logger.error(f"Erro ao listar produtos: {e}")
            return Response({"error": str(e)}, status=500)

    def create(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = request.data
        if not data.get("nome") or data.get("valor_padrao") is None:
            return Response({"error": "Nome e valor padrão são obrigatórios."}, status=400)

        payload = {
            "nome": data["nome"].strip(),
            "categoria": data.get("categoria") or None,
            "valor_padrao": float(data.get("valor_padrao") or 0),
            "ativo": data.get("ativo", True),
        }
        try:
            res = supabase.table("produtos").insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar produto."}, status=500)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class EntradaViewSet(viewsets.ViewSet):
    """
    CRUD de Entradas de mercadorias no estoque.
    Colaborador pode listar e registrar novas entradas.
    Admin pode editar e excluir.
    """
    permission_classes = [IsColaborador]

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = (
                supabase.table("entradas")
                .select("*, produtos(nome, categoria, valor_padrao)")
                .is_("deleted_at", "null")
                .order("created_at", desc=True)
                .execute()
            )
            entries = res.data or []
            for e in entries:
                prod = e.get("produtos") or {}
                e["produto_nome"] = prod.get("nome", "Desconhecido")
                e["categoria"] = prod.get("categoria")
            return Response(entries)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = request.data
        id_produto = data.get("id_produto")
        quantidade = data.get("quantidade_inicial") or data.get("quantidade")

        if not id_produto:
            return Response({"error": "id_produto é obrigatório."}, status=400)
        try:
            quantidade = int(quantidade)
            if quantidade <= 0:
                return Response({"error": "A quantidade deve ser maior que zero."}, status=400)
        except (ValueError, TypeError):
            return Response({"error": "Quantidade inválida."}, status=400)

        payload = {
            "id_produto": id_produto,
            "quantidade_inicial": quantidade,
            "quantidade_atual": quantidade,
            "placa_caminhao": data.get("placa_caminhao") or None,
            "lote_nf": data.get("lote_nf") or None,
        }
        try:
            res = supabase.table("entradas").insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao registrar entrada."}, status=500)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        """Soft delete de entrada — restrito a Admin"""
        if not (request.user and getattr(request.user, "role", None) == "ADMIN"):
            return Response({"error": "Apenas administradores podem excluir entradas."}, status=403)
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            supabase.table("entradas").update({"deleted_at": timezone.now().isoformat()}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class SaidaViewSet(viewsets.ViewSet):
    """
    Listagem e registro de saídas de estoque (avaria, troca ou manual).
    """
    permission_classes = [IsColaborador]

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = (
                supabase.table("saidas")
                .select("*, produtos(nome), entradas(placa_caminhao, lote_nf)")
                .order("created_at", desc=True)
                .execute()
            )
            return Response(res.data or [])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = request.data
        id_produto = data.get("id_produto")
        quantidade = data.get("quantidade")
        tipo = data.get("tipo", "OUTRO")
        id_venda = data.get("id_venda") or None

        if not id_produto or not quantidade:
            return Response({"error": "id_produto e quantidade são obrigatórios."}, status=400)

        try:
            qty = int(quantidade)
            saidas = deduct_stock_fifo(id_produto, qty, venda_id=id_venda, tipo=tipo)
            return Response(saidas, status=status.HTTP_201_CREATED)
        except ValueError as ve:
            return Response({"error": str(ve)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
