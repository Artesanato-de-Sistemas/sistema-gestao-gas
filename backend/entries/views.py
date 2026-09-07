import logging

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsColaborador
from config.supabase_client import supabase
from inventory.services import deduct_stock_fifo

logger = logging.getLogger(__name__)


class PagamentoViewSet(viewsets.ViewSet):
    permission_classes = [IsColaborador]

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            cli_id = request.query_params.get("id_cliente") or request.query_params.get("client_id")
            date = request.query_params.get("data") or request.query_params.get("date")

            query = (
                supabase.table("pagamentos")
                .select("*, clientes(nome), vendas(valor_total)")
                .order("created_at", desc=True)
            )
            if cli_id:
                query = query.eq("id_cliente", cli_id)

            res = query.execute()
            data = res.data or []
            if date:
                data = [p for p in data if (p.get("created_at") or "").startswith(date)]

            for p in data:
                cli = p.get("clientes") or {}
                p["cliente_nome"] = cli.get("nome", "Cliente sem nome")
                p["client_name"] = p["cliente_nome"]
                p["amount"] = float(p.get("valor") or 0)
                p["payment_method"] = p.get("forma_pagamento")
                p["date"] = (p.get("created_at") or "")[:10]

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = request.data
        id_cliente = data.get("id_cliente") or data.get("client_id")
        id_venda = data.get("id_venda") or data.get("order_id") or None
        valor = data.get("valor") or data.get("amount")
        forma_pagamento = data.get("forma_pagamento") or data.get("payment_method") or "DINHEIRO"
        created_at = data.get("created_at") or data.get("date")

        if not id_cliente:
            return Response({"error": "id_cliente é obrigatório."}, status=400)
        try:
            val = float(valor)
            if val <= 0:
                return Response({"error": "Valor deve ser maior que zero."}, status=400)
        except (ValueError, TypeError):
            return Response({"error": "Valor inválido."}, status=400)

        payload = {
            "id_cliente": id_cliente,
            "id_venda": id_venda,
            "valor": val,
            "forma_pagamento": forma_pagamento,
        }
        if created_at:
            payload["created_at"] = created_at

        try:
            res = supabase.table("pagamentos").insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao registrar pagamento."}, status=500)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        if not (request.user and getattr(request.user, "role", None) == "ADMIN"):
            return Response({"error": "Apenas administradores podem excluir pagamentos."}, status=403)
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            supabase.table("pagamentos").delete().eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class SangriaViewSet(viewsets.ViewSet):
    permission_classes = [IsColaborador]

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            func_id = request.query_params.get("id_funcionario") or request.query_params.get("driver_id")
            date = request.query_params.get("data") or request.query_params.get("date")

            query = (
                supabase.table("sangrias")
                .select("*, funcionarios(nome)")
                .order("created_at", desc=True)
            )
            if func_id:
                query = query.eq("id_funcionario", func_id)

            res = query.execute()
            data = res.data or []
            if date:
                data = [s for s in data if (s.get("created_at") or "").startswith(date)]

            for s in data:
                func = s.get("funcionarios") or {}
                s["funcionario_nome"] = func.get("nome", "Funcionário")
                s["driver_name"] = s["funcionario_nome"]
                s["amount"] = float(s.get("valor") or 0)
                s["date"] = (s.get("created_at") or "")[:10]

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = request.data
        id_funcionario = data.get("id_funcionario") or data.get("delivery_driver_id") or (
            request.user.id if request.user and request.user.is_authenticated else None
        )
        tipo = data.get("tipo") or "SANGRIA"
        descricao = data.get("descricao") or data.get("description") or "Sangria de caixa"
        valor = data.get("valor") or data.get("amount")
        created_at = data.get("created_at") or data.get("date")

        if not id_funcionario:
            return Response({"error": "id_funcionario é obrigatório."}, status=400)
        try:
            val = float(valor)
            if val <= 0:
                return Response({"error": "Valor deve ser maior que zero."}, status=400)
        except (ValueError, TypeError):
            return Response({"error": "Valor inválido."}, status=400)

        payload = {
            "id_funcionario": id_funcionario,
            "tipo": tipo,
            "descricao": descricao,
            "valor": val,
        }
        if created_at:
            payload["created_at"] = created_at

        try:
            res = supabase.table("sangrias").insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao registrar sangria."}, status=500)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        if not (request.user and getattr(request.user, "role", None) == "ADMIN"):
            return Response({"error": "Apenas administradores podem excluir sangrias."}, status=403)
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            supabase.table("sangrias").delete().eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PlanilhaView(APIView):
    """
    Endpoint consolidado para consulta da planilha diária e fechamento do dia.
    Compatível com os parâmetros e estado da tela Planilha.
    """
    permission_classes = [IsColaborador]

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        driver_id = request.query_params.get("driver_id") or request.query_params.get("id_funcionario")
        raw_date = request.query_params.get("date") or request.query_params.get("data")
        date_param = raw_date or timezone.now().strftime("%Y-%m-%d")

        try:
            # 1. Vendas do dia
            vendas_q = (
                supabase.table("vendas")
                .select("*, clientes(nome), funcionarios(nome), itens_venda(*, produtos(nome))")
                .is_("deleted_at", "null")
                .order("created_at")
            )
            if driver_id:
                vendas_q = vendas_q.eq("id_funcionario", driver_id)
            vendas_all = vendas_q.execute().data or []
            vendas = [v for v in vendas_all if (v.get("created_at") or "").startswith(date_param)]

            for v in vendas:
                cli = v.get("clientes") or {}
                func = v.get("funcionarios") or {}
                v["client_name"] = cli.get("nome", "Cliente")
                v["cliente_nome"] = v["client_name"]
                v["driver_name"] = func.get("nome")
                v["total_amount"] = float(v.get("valor_total") or 0)
                # Resumo de produto e forma de pagamento se houver itens
                items = v.get("itens_venda") or []
                if items:
                    v["product"] = ", ".join(
                        i.get("produtos", {}).get("nome", "Gás") for i in items if i.get("produtos")
                    )
                    v["quantity"] = sum(int(i.get("quantidade") or 0) for i in items)
                    v["unit_cost"] = float(items[0].get("valor_unitario") or 0)

            # 2. Pagamentos do dia
            pag_q = supabase.table("pagamentos").select("*, clientes(nome)").order("created_at")
            pag_all = pag_q.execute().data or []
            pagamentos = [p for p in pag_all if (p.get("created_at") or "").startswith(date_param)]
            for p in pagamentos:
                cli = p.get("clientes") or {}
                p["client_name"] = cli.get("nome", "Cliente")
                p["cliente_nome"] = p["client_name"]
                p["amount"] = float(p.get("valor") or 0)
                p["payment_method"] = p.get("forma_pagamento")
                p["date"] = (p.get("created_at") or "")[:10]

            # 3. Sangrias do dia
            sang_q = supabase.table("sangrias").select("*, funcionarios(nome)").order("created_at")
            if driver_id:
                sang_q = sang_q.eq("id_funcionario", driver_id)
            sang_all = sang_q.execute().data or []
            sangrias = [s for s in sang_all if (s.get("created_at") or "").startswith(date_param)]
            for s in sangrias:
                func = s.get("funcionarios") or {}
                s["driver_name"] = func.get("nome")
                s["amount"] = float(s.get("valor") or 0)
                s["description"] = s.get("descricao")
                s["type"] = "SAIDA"
                s["date"] = (s.get("created_at") or "")[:10]

            # 4. Saídas de estoque do dia
            saidas_q = supabase.table("saidas").select("*, produtos(nome)").order("created_at")
            saidas_all = saidas_q.execute().data or []
            saidas = [s for s in saidas_all if (s.get("created_at") or "").startswith(date_param)]

            # 5. Cálculo dos Totais
            totals = {
                "DINHEIRO": 0.0,
                "PIX": 0.0,
                "CREDITO": 0.0,
                "DEBITO": 0.0,
                "CHEQUE": 0.0,
                "A_PRAZO": 0.0,
                "TOTAL_VENDAS": 0.0,
                "TOTAL_PAGAMENTOS": 0.0,
                "TOTAL_SANGRIAS": 0.0,
                "SALDO_CAIXA": 0.0,
                "TOTAL": 0.0,
            }

            for v in vendas:
                totals["TOTAL_VENDAS"] += v["total_amount"]

            for p in pagamentos:
                m = str(p.get("forma_pagamento", "DINHEIRO")).upper()
                amt = float(p.get("valor") or 0)
                totals["TOTAL_PAGAMENTOS"] += amt
                if "PIX" in m:
                    totals["PIX"] += amt
                elif "CREDITO" in m or "CRÉDITO" in m:
                    totals["CREDITO"] += amt
                elif "DEBITO" in m or "DÉBITO" in m:
                    totals["DEBITO"] += amt
                elif "CHEQUE" in m:
                    totals["CHEQUE"] += amt
                else:
                    totals["DINHEIRO"] += amt
                totals["TOTAL"] += amt

            for s in sangrias:
                totals["TOTAL_SANGRIAS"] += float(s.get("valor") or 0)

            totals["SALDO_CAIXA"] = round(totals["TOTAL_PAGAMENTOS"] - totals["TOTAL_SANGRIAS"], 2)
            totals["TOTAL_VENDAS"] = round(totals["TOTAL_VENDAS"], 2)
            totals["TOTAL_PAGAMENTOS"] = round(totals["TOTAL_PAGAMENTOS"], 2)
            totals["TOTAL_SANGRIAS"] = round(totals["TOTAL_SANGRIAS"], 2)

            return Response({
                "vendas": vendas,
                "orders": vendas,
                "pagamentos": pagamentos,
                "payments": pagamentos,
                "sangrias": sangrias,
                "cash_entries": sangrias,
                "saidas": saidas,
                "totals": totals,
            })
        except Exception as e:
            logger.error(f"Erro ao buscar dados da planilha: {e}")
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        """
        Salva lote de vendas, pagamentos e sangrias do fechamento diário da planilha.
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        data = request.data
        driver_id = data.get("driver_id") or data.get("id_funcionario")
        date = data.get("date") or data.get("data") or timezone.now().strftime("%Y-%m-%d")
        orders_data = data.get("orders") or data.get("vendas") or []
        payments_data = data.get("payments") or data.get("pagamentos") or []
        cash_data = data.get("cash_entries") or data.get("sangrias") or []

        if not driver_id:
            return Response({"error": "Funcionário é obrigatório."}, status=400)

        saved = {
            "vendas": [],
            "pagamentos": [],
            "sangrias": [],
        }

        try:
            # 1. Salvar vendas
            for o in orders_data:
                cid = o.get("client_id") or o.get("id_cliente")
                pid = o.get("id_produto")
                if not pid and o.get("product"):
                    p_query = supabase.table("produtos").select("id").ilike("nome", f"%{o['product']}%").limit(1)
                    p_res = p_query.execute()
                    if p_res.data:
                        pid = p_res.data[0]["id"]

                qty = int(o.get("quantity") or o.get("quantidade") or 1)
                unit_cost = float(o.get("unit_cost") or o.get("valor_unitario") or 0)
                tot = qty * unit_cost

                if cid and pid:
                    # Cria venda
                    v_res = supabase.table("vendas").insert({
                        "id_cliente": cid,
                        "id_funcionario": driver_id,
                        "valor_total": tot,
                        "created_at": f"{date}T12:00:00+00:00",
                    }).execute()
                    if v_res.data:
                        v_id = v_res.data[0]["id"]
                        # Cria item
                        supabase.table("itens_venda").insert({
                            "id_venda": v_id,
                            "id_produto": pid,
                            "quantidade": qty,
                            "valor_unitario": unit_cost,
                            "valor_subtotal": tot,
                            "created_at": f"{date}T12:00:00+00:00",
                        }).execute()
                        # Baixa FIFO
                        try:
                            deduct_stock_fifo(pid, qty, venda_id=v_id, tipo="VENDA")
                        except Exception as ex:
                            logger.warning(f"Aviso de baixa de estoque na venda: {ex}")

                        # Pagamento automático se forma não for a prazo
                        form = o.get("payment_form") or o.get("forma_pagamento")
                        if form and form != "A PRAZO (VENDA)":
                            supabase.table("pagamentos").insert({
                                "id_venda": v_id,
                                "id_cliente": cid,
                                "valor": tot,
                                "forma_pagamento": form,
                                "created_at": f"{date}T12:00:00+00:00",
                            }).execute()

                        saved["vendas"].append(v_res.data[0])

            # 2. Salvar pagamentos avulsos
            for p in payments_data:
                cid = p.get("client_id") or p.get("id_cliente")
                amt = float(p.get("amount") or p.get("valor") or 0)
                method = p.get("payment_method") or p.get("forma_pagamento") or "DINHEIRO"
                order_id = p.get("order_id") or p.get("id_venda") or None
                if cid and amt > 0:
                    res_p = supabase.table("pagamentos").insert({
                        "id_cliente": cid,
                        "id_venda": order_id,
                        "valor": amt,
                        "forma_pagamento": method,
                        "created_at": f"{date}T12:00:00+00:00",
                    }).execute()
                    if res_p.data:
                        saved["pagamentos"].append(res_p.data[0])

            # 3. Salvar sangrias
            for c in cash_data:
                amt = float(c.get("amount") or c.get("valor") or 0)
                desc = c.get("description") or c.get("descricao") or "Sangria"
                tipo = c.get("category") or c.get("tipo") or "SAIDA"
                if amt > 0:
                    res_s = supabase.table("sangrias").insert({
                        "id_funcionario": driver_id,
                        "tipo": tipo,
                        "descricao": desc,
                        "valor": amt,
                        "created_at": f"{date}T12:00:00+00:00",
                    }).execute()
                    if res_s.data:
                        saved["sangrias"].append(res_s.data[0])

            msg = (
                f"Planilha salva com sucesso! {len(saved['vendas'])} vendas, "
                f"{len(saved['pagamentos'])} pagamentos, {len(saved['sangrias'])} sangrias."
            )
            return Response({
                "success": True,
                "message": msg,
                "data": saved,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Erro ao salvar planilha: {e}")
            return Response({"error": str(e)}, status=500)
