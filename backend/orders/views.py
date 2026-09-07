import logging

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsColaborador
from config.supabase_client import supabase
from inventory.services import deduct_stock_fifo

logger = logging.getLogger(__name__)


class VendaViewSet(viewsets.ViewSet):
    """
    ViewSet para gestão de Vendas e Itens de Venda.
    Colaborador pode listar e registrar vendas.
    Admin pode cancelar/excluir.
    """
    permission_classes = [IsColaborador]

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            date_filter = request.query_params.get("date") or request.query_params.get("data")
            funcionario_filter = request.query_params.get("id_funcionario") or request.query_params.get("driver_id")
            cliente_filter = request.query_params.get("id_cliente") or request.query_params.get("client_id")

            query = (
                supabase.table("vendas")
                .select("*, clientes(nome, telefone), funcionarios(nome), itens_venda(*, produtos(nome))")
                .is_("deleted_at", "null")
                .order("created_at", desc=True)
            )

            if funcionario_filter:
                query = query.eq("id_funcionario", funcionario_filter)
            if cliente_filter:
                query = query.eq("id_cliente", cliente_filter)

            res = query.execute()
            vendas = res.data or []

            # Se houver filtro de data (YYYY-MM-DD)
            if date_filter:
                vendas = [v for v in vendas if (v.get("created_at") or "").startswith(date_filter)]

            # Normalização de nomes para facilitar consumo no frontend
            for v in vendas:
                cli = v.get("clientes") or {}
                func = v.get("funcionarios") or {}
                v["cliente_nome"] = cli.get("nome", "Cliente sem nome")
                v["funcionario_nome"] = func.get("nome", "Sem funcionário")
                # Compatibilidade com campos antigos do frontend
                v["client_name"] = v["cliente_nome"]
                v["driver_name"] = v["funcionario_nome"]
                v["total_amount"] = float(v.get("valor_total") or 0)

            return Response(vendas)
        except Exception as e:
            logger.error(f"Erro ao listar vendas: {e}")
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = (
                supabase.table("vendas")
                .select("*, clientes(nome, telefone), funcionarios(nome), itens_venda(*, produtos(nome))")
                .eq("id", pk)
                .execute()
            )
            if not res.data:
                return Response({"error": "Venda não encontrada."}, status=404)
            venda = res.data[0]
            cli = venda.get("clientes") or {}
            func = venda.get("funcionarios") or {}
            venda["cliente_nome"] = cli.get("nome")
            venda["funcionario_nome"] = func.get("nome")
            return Response(venda)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        """
        Criação atômica de Venda + Itens de Venda + Baixa de Estoque (FIFO) + Pagamento imediato (se à vista).
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        data = request.data
        id_cliente = data.get("id_cliente") or data.get("client_id")
        id_funcionario = data.get("id_funcionario") or data.get("delivery_driver_id") or (
            request.user.id if request.user and request.user.is_authenticated else None
        )
        itens = data.get("itens") or []
        created_at = data.get("created_at") or data.get("date")

        # Suporte a payload simplificado com produto único (legado do frontend)
        if not itens and (data.get("id_produto") or data.get("product")):
            prod_id = data.get("id_produto")
            if not prod_id and data.get("product"):
                # Busca id do produto pelo nome
                p_res = supabase.table("produtos").select("id").ilike("nome", f"%{data['product']}%").limit(1).execute()
                if p_res.data:
                    prod_id = p_res.data[0]["id"]

            itens = [{
                "id_produto": prod_id,
                "quantidade": int(data.get("quantity") or data.get("quantidade") or 1),
                "valor_unitario": float(data.get("unit_cost") or data.get("valor_unitario") or 0),
            }]

        if not id_cliente:
            return Response({"error": "Cliente é obrigatório."}, status=400)
        if not id_funcionario:
            return Response({"error": "Funcionário é obrigatório."}, status=400)
        if not itens:
            return Response({"error": "Ao menos um produto deve ser informado na venda."}, status=400)

        # 1. Pré-validação de estoque para todos os itens
        try:
            for item in itens:
                pid = item.get("id_produto")
                qty = int(item.get("quantidade") or 0)
                if not pid or qty <= 0:
                    return Response({"error": "Item de venda inválido."}, status=400)

                # Checa estoque disponível
                res_estoque = (
                    supabase.table("entradas")
                    .select("quantidade_atual")
                    .eq("id_produto", pid)
                    .is_("deleted_at", "null")
                    .gt("quantidade_atual", 0)
                    .execute()
                )
                disponivel = sum(int(e.get("quantidade_atual") or 0) for e in (res_estoque.data or []))
                if disponivel < qty:
                    # Busca nome do produto para mensagem clara
                    prod_info = supabase.table("produtos").select("nome").eq("id", pid).execute()
                    p_nome = prod_info.data[0]["nome"] if prod_info.data else "Produto"
                    return Response({
                        "error": f"Estoque insuficiente para '{p_nome}'. Disponível: {disponivel}, Solicitado: {qty}"
                    }, status=400)
        except Exception as e:
            return Response({"error": f"Erro na validação de estoque: {e}"}, status=400)

        # 2. Calcula total da venda
        valor_total = sum(int(i.get("quantidade", 0)) * float(i.get("valor_unitario", 0)) for i in itens)

        # 3. Cria registro da Venda
        venda_payload = {
            "id_cliente": id_cliente,
            "id_funcionario": id_funcionario,
            "valor_total": valor_total,
        }
        if created_at:
            venda_payload["created_at"] = created_at

        try:
            venda_res = supabase.table("vendas").insert(venda_payload).execute()
            if not venda_res.data:
                return Response({"error": "Falha ao registrar venda."}, status=500)
            venda = venda_res.data[0]
            venda_id = venda["id"]

            # 4. Insere Itens de Venda e executa Baixa de Estoque FIFO (gerando Saidas)
            created_itens = []
            for item in itens:
                pid = item["id_produto"]
                qty = int(item["quantidade"])
                unit_val = float(item["valor_unitario"])
                subtotal = round(qty * unit_val, 2)

                item_payload = {
                    "id_venda": venda_id,
                    "id_produto": pid,
                    "quantidade": qty,
                    "valor_unitario": unit_val,
                    "valor_subtotal": subtotal,
                }
                it_res = supabase.table("itens_venda").insert(item_payload).execute()
                if it_res.data:
                    created_itens.append(it_res.data[0])

                # Baixa atômica de estoque em entradas e geração de saidas
                deduct_stock_fifo(pid, qty, venda_id=venda_id, tipo="VENDA")

            venda["itens"] = created_itens

            # 5. Se foi informado pagamento imediato à vista
            forma_pagamento = data.get("forma_pagamento") or data.get("payment_form")
            if forma_pagamento and forma_pagamento != "A PRAZO (VENDA)":
                valor_pago = float(data.get("valor_recebido") or data.get("payment_received") or valor_total)
                if valor_pago > 0:
                    pag_payload = {
                        "id_venda": venda_id,
                        "id_cliente": id_cliente,
                        "valor": valor_pago,
                        "forma_pagamento": forma_pagamento,
                    }
                    if created_at:
                        pag_payload["created_at"] = created_at
                    supabase.table("pagamentos").insert(pag_payload).execute()

            return Response(venda, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Erro ao processar venda: {e}")
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        """Soft delete da venda — restrito a Admin"""
        if not (request.user and getattr(request.user, "role", None) == "ADMIN"):
            return Response({"error": "Apenas administradores podem cancelar vendas."}, status=403)
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            supabase.table("vendas").update({"deleted_at": timezone.now().isoformat()}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["get"], url_path="pendentes")
    def pendentes(self, request):
        """
        Retorna vendas a prazo que ainda possuem saldo em aberto.
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        client_id = request.query_params.get("client_id") or request.query_params.get("id_cliente")

        try:
            # Busca todas as vendas ativas
            query = (
                supabase.table("vendas")
                .select("*, clientes(nome), itens_venda(*, produtos(nome))")
                .is_("deleted_at", "null")
                .order("created_at", desc=True)
            )
            if client_id:
                query = query.eq("id_cliente", client_id)

            vendas = query.execute().data or []

            # Busca todos os pagamentos vinculados às vendas
            pag_res = supabase.table("pagamentos").select("id_venda, valor").execute()
            pag_map = {}
            for p in (pag_res.data or []):
                vid = p.get("id_venda")
                if vid:
                    pag_map[vid] = pag_map.get(vid, 0.0) + float(p.get("valor") or 0)

            pendentes = []
            for v in vendas:
                vid = v["id"]
                tot = float(v.get("valor_total") or 0)
                pago = pag_map.get(vid, 0.0)
                saldo = round(tot - pago, 2)
                if saldo > 0:
                    cli = v.get("clientes") or {}
                    pendentes.append({
                        "id": vid,
                        "id_cliente": v.get("id_cliente"),
                        "client_id": v.get("id_cliente"),
                        "client_name": cli.get("nome"),
                        "cliente_nome": cli.get("nome"),
                        "total_amount": tot,
                        "valor_total": tot,
                        "payment_received": pago,
                        "valor_pago": pago,
                        "pending_amount": saldo,
                        "saldo_pendente": saldo,
                        "created_at": v.get("created_at"),
                        "date": (v.get("created_at") or "")[:10],
                        "itens": v.get("itens_venda") or [],
                    })

            return Response(pendentes)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    # Alias para compatibilidade com rotas legadas
    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        return self.pendentes(request)
