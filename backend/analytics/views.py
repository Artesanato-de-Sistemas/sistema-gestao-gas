import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAdmin
from config.supabase_client import supabase

logger = logging.getLogger(__name__)


class DashboardMetricsView(APIView):
    """
    Métricas do Dashboard:
    - Alertas de estoque
    - Alertas de inadimplência
    - Resumo atual de sangria
    - Clientes ativos
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        try:
            today_str = timezone.now().strftime("%Y-%m-%d")
            month_str = timezone.now().strftime("%Y-%m")

            # 1. Alertas de estoque (baseado em produtos e entradas ativas)
            prods_res = supabase.table("produtos").select("*").eq("ativo", True).execute()
            products = prods_res.data or []

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

            alertas_estoque = []
            stock_p13 = 0
            stock_p20 = 0
            stock_p45 = 0

            for p in products:
                pid = str(p["id"])
                p_nome = p.get("nome", "")
                qty = stock_map.get(pid, 0)

                # Classificação legada por nome/categoria
                p_upper = p_nome.upper()
                if "13" in p_upper or "P13" in p_upper:
                    stock_p13 += qty
                elif "20" in p_upper or "P20" in p_upper:
                    stock_p20 += qty
                elif "45" in p_upper or "P45" in p_upper:
                    stock_p45 += qty

                # Alerta se estoque for baixo (<= 10 unidades)
                if qty <= 10:
                    alertas_estoque.append({
                        "id_produto": pid,
                        "nome": p_nome,
                        "quantidade": qty,
                        "critico": qty <= 3,
                    })

            alertas_estoque.sort(key=lambda x: x["quantidade"])

            # 2. Alertas de inadimplência (clientes com vendas em aberto > pagamentos)
            clients_res = supabase.table("clientes").select("id, nome, telefone, limite_credito").execute()
            clients = clients_res.data or []

            vendas_res = supabase.table("vendas").select("id_cliente, valor_total").is_("deleted_at", "null").execute()
            vendas_map = {}
            for v in (vendas_res.data or []):
                cid = str(v.get("id_cliente"))
                vendas_map[cid] = vendas_map.get(cid, 0.0) + float(v.get("valor_total") or 0)

            pags_res = supabase.table("pagamentos").select("id_cliente, valor").execute()
            pags_map = {}
            for p in (pags_res.data or []):
                cid = str(p.get("id_cliente"))
                pags_map[cid] = pags_map.get(cid, 0.0) + float(p.get("valor") or 0)

            alertas_inadimplencia = []
            total_inadimplente = 0.0

            for c in clients:
                cid = str(c["id"])
                tot_v = vendas_map.get(cid, 0.0)
                tot_p = pags_map.get(cid, 0.0)
                debito = round(tot_v - tot_p, 2)
                if debito > 0.01:
                    total_inadimplente += debito
                    alertas_inadimplencia.append({
                        "id_cliente": cid,
                        "nome": c.get("nome"),
                        "telefone": c.get("telefone"),
                        "valor_devido": debito,
                        "limite_credito": float(c.get("limite_credito") or 0),
                    })

            alertas_inadimplencia.sort(key=lambda x: x["valor_devido"], reverse=True)

            # 3. Resumo atual de sangria
            sangrias_res = supabase.table("sangrias").select("*").order("created_at", desc=True).execute()
            sangrias_all = sangrias_res.data or []

            sangrias_hoje = [s for s in sangrias_all if (s.get("created_at") or "").startswith(today_str)]
            sangrias_mes = [s for s in sangrias_all if (s.get("created_at") or "").startswith(month_str)]

            total_sangrias_hoje = sum(float(s.get("valor") or 0) for s in sangrias_hoje)
            total_sangrias_mes = sum(float(s.get("valor") or 0) for s in sangrias_mes)

            por_tipo = {}
            for s in sangrias_hoje:
                t = s.get("tipo", "OUTRO")
                por_tipo[t] = por_tipo.get(t, 0.0) + float(s.get("valor") or 0)

            # 4. Clientes ativos
            total_clientes = len(clients)
            # Clientes ativos: clientes com compras nos últimos 30 dias
            since_30_days = (timezone.now() - timedelta(days=30)).isoformat()
            recent_vendas = (
                supabase.table("vendas")
                .select("id_cliente")
                .is_("deleted_at", "null")
                .gte("created_at", since_30_days)
                .execute()
            )
            active_client_ids = {v["id_cliente"] for v in (recent_vendas.data or []) if v.get("id_cliente")}
            clientes_ativos_count = len(active_client_ids)

            # Vendas do dia
            vendas_hoje_res = (
                supabase.table("vendas")
                .select("valor_total")
                .is_("deleted_at", "null")
                .gte("created_at", f"{today_str}T00:00:00")
                .execute()
            )
            vendas_hoje = vendas_hoje_res.data or []
            sales_today = sum(float(v.get("valor_total") or 0) for v in vendas_hoje)

            return Response({
                "alertas_estoque": alertas_estoque,
                "alertas_inadimplencia": alertas_inadimplencia,
                "total_inadimplente": round(total_inadimplente, 2),
                "inadimplentes_count": len(alertas_inadimplencia),
                "resumo_sangrias": {
                    "total_hoje": round(total_sangrias_hoje, 2),
                    "total_mes": round(total_sangrias_mes, 2),
                    "por_tipo": por_tipo,
                    "registros_hoje": sangrias_hoje,
                },
                "clientes_ativos": {
                    "total_cadastrados": total_clientes,
                    "ativos_30_dias": clientes_ativos_count,
                },
                # Compatibilidade legada
                "stock_p13": stock_p13,
                "stock_p20": stock_p20,
                "stock_p45": stock_p45,
                "sales_today": round(sales_today, 2),
                "orders_today": len(vendas_hoje),
                "overdue_invoices": len(alertas_inadimplencia),
            })

        except Exception as e:
            logger.error(f"Erro ao obter métricas do dashboard: {e}")
            return Response({"error": str(e)}, status=500)


class PesquisaEstoqueView(APIView):
    """
    Sub-aba 1: Estoque diário.
    Tudo que tem disponível para o dia, descontando saídas em tempo real.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        data_ref = request.query_params.get("data") or timezone.now().strftime("%Y-%m-%d")

        try:
            prods = supabase.table("produtos").select("*").eq("ativo", True).order("nome").execute().data or []
            entradas_all = supabase.table("entradas").select("*").is_("deleted_at", "null").execute().data or []
            saidas_all = supabase.table("saidas").select("*").execute().data or []

            resultado = []
            for p in prods:
                pid = str(p["id"])
                p_entradas = [e for e in entradas_all if str(e.get("id_produto")) == pid]
                p_saidas = [s for s in saidas_all if str(s.get("id_produto")) == pid]

                # Saldo em tempo real disponível agora
                saldo_disponivel = sum(int(e.get("quantidade_atual") or 0) for e in p_entradas)

                # Movimentações específicas do dia filtrado
                entradas_do_dia = sum(
                    int(e.get("quantidade_inicial") or 0)
                    for e in p_entradas
                    if (e.get("created_at") or "").startswith(data_ref)
                )
                saidas_do_dia = sum(
                    int(s.get("quantidade") or 0)
                    for s in p_saidas
                    if (s.get("created_at") or "").startswith(data_ref)
                )

                resultado.append({
                    "id_produto": pid,
                    "produto": p.get("nome"),
                    "categoria": p.get("categoria") or "-",
                    "valor_padrao": float(p.get("valor_padrao") or 0),
                    "entradas_dia": entradas_do_dia,
                    "saidas_dia": saidas_do_dia,
                    "saldo_disponivel": saldo_disponivel,
                    "data": data_ref,
                })

            return Response(resultado)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PesquisaFinanceiroView(APIView):
    """
    Sub-aba 2: Financeiro diário.
    Toda a movimentação financeira do dia + balanço + sangria.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        data_ref = request.query_params.get("data") or timezone.now().strftime("%Y-%m-%d")

        try:
            # 1. Vendas do dia
            vendas = (
                supabase.table("vendas")
                .select("*, clientes(nome), funcionarios(nome)")
                .is_("deleted_at", "null")
                .execute()
                .data or []
            )
            vendas_dia = [v for v in vendas if (v.get("created_at") or "").startswith(data_ref)]

            # 2. Pagamentos do dia
            pags = (
                supabase.table("pagamentos")
                .select("*, clientes(nome)")
                .execute()
                .data or []
            )
            pags_dia = [p for p in pags if (p.get("created_at") or "").startswith(data_ref)]

            # 3. Sangrias do dia
            sangrias = (
                supabase.table("sangrias")
                .select("*, funcionarios(nome)")
                .execute()
                .data or []
            )
            sangrias_dia = [s for s in sangrias if (s.get("created_at") or "").startswith(data_ref)]

            totais_por_forma = {}
            total_recebido = 0.0

            for p in pags_dia:
                forma = (p.get("forma_pagamento") or "DINHEIRO").upper()
                v = float(p.get("valor") or 0)
                totais_por_forma[forma] = totais_por_forma.get(forma, 0.0) + v
                total_recebido += v

            total_vendas_bruto = sum(float(v.get("valor_total") or 0) for v in vendas_dia)
            total_sangrias = sum(float(s.get("valor") or 0) for s in sangrias_dia)
            balanco_liquido = round(total_recebido - total_sangrias, 2)

            return Response({
                "data": data_ref,
                "total_vendas_bruto": round(total_vendas_bruto, 2),
                "total_recebido": round(total_recebido, 2),
                "total_sangrias": round(total_sangrias, 2),
                "balanco_liquido": balanco_liquido,
                "totais_por_forma": {k: round(v, 2) for k, v in totais_por_forma.items()},
                "vendas": vendas_dia,
                "pagamentos": pags_dia,
                "sangrias": sangrias_dia,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PesquisaEntregadoresView(APIView):
    """
    Sub-aba 3: Entregadores / Funcionários.
    Detalhamento diário, semanal, mensal e overall.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        periodo = request.query_params.get("periodo", "diario").lower()
        now = timezone.now()

        if periodo == "diario":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif periodo == "semanal":
            start_date = now - timedelta(days=7)
        elif periodo == "mensal":
            start_date = now - timedelta(days=30)
        else:  # overall
            start_date = None

        try:
            funcs = supabase.table("funcionarios").select("id, nome, role").execute().data or []

            # Busca vendas no período
            v_query = supabase.table("vendas").select("*, itens_venda(quantidade)").is_("deleted_at", "null")
            if start_date:
                v_query = v_query.gte("created_at", start_date.isoformat())
            vendas = v_query.execute().data or []

            # Busca sangrias no período
            s_query = supabase.table("sangrias").select("*")
            if start_date:
                s_query = s_query.gte("created_at", start_date.isoformat())
            sangrias = s_query.execute().data or []

            detalhamento = []
            for f in funcs:
                fid = str(f["id"])
                f_vendas = [v for v in vendas if str(v.get("id_funcionario")) == fid]
                f_sangrias = [s for s in sangrias if str(s.get("id_funcionario")) == fid]

                pedidos_count = len(f_vendas)
                itens_vendidos = sum(
                    sum(int(it.get("quantidade") or 0) for it in (v.get("itens_venda") or []))
                    for v in f_vendas
                )
                valor_faturado = sum(float(v.get("valor_total") or 0) for v in f_vendas)
                valor_sangrias = sum(float(s.get("valor") or 0) for s in f_sangrias)
                saldo_liquido = round(valor_faturado - valor_sangrias, 2)
                ticket_medio = round(valor_faturado / pedidos_count, 2) if pedidos_count > 0 else 0.0

                detalhamento.append({
                    "id_funcionario": fid,
                    "driverId": fid,
                    "nome": f.get("nome"),
                    "driverName": f.get("nome"),
                    "role": f.get("role"),
                    "pedidos_count": pedidos_count,
                    "cylindersSold": itens_vendidos,
                    "itens_vendidos": itens_vendidos,
                    "grossAmount": round(valor_faturado, 2),
                    "valor_faturado": round(valor_faturado, 2),
                    "withdrawals": round(valor_sangrias, 2),
                    "valor_sangrias": round(valor_sangrias, 2),
                    "netProfit": saldo_liquido,
                    "saldo_liquido": saldo_liquido,
                    "ticket_medio": ticket_medio,
                })

            detalhamento.sort(key=lambda x: x["valor_faturado"], reverse=True)
            return Response(detalhamento)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PesquisaAvancadaView(APIView):
    """
    Sub-aba 4: Pesquisa avançada e relatórios completos com exportação.
    Cruza dados de vendas, itens, clientes, funcionários e pagamentos.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        data_inicio = request.query_params.get("data_inicio")
        data_fim = request.query_params.get("data_fim")
        id_funcionario = request.query_params.get("id_funcionario")
        id_cliente = request.query_params.get("id_cliente")
        id_produto = request.query_params.get("id_produto")

        try:
            query = (
                supabase.table("vendas")
                .select("*, clientes(nome, telefone), funcionarios(nome), itens_venda(*, produtos(nome))")
                .is_("deleted_at", "null")
                .order("created_at", desc=True)
            )

            if id_funcionario:
                query = query.eq("id_funcionario", id_funcionario)
            if id_cliente:
                query = query.eq("id_cliente", id_cliente)
            if data_inicio:
                query = query.gte("created_at", f"{data_inicio}T00:00:00")
            if data_fim:
                query = query.lte("created_at", f"{data_fim}T23:59:59")

            vendas = query.execute().data or []

            # Filtro opcional por produto nos itens
            if id_produto:
                vendas = [
                    v for v in vendas
                    if any(str(it.get("id_produto")) == str(id_produto) for it in (v.get("itens_venda") or []))
                ]

            relatorio = []
            for v in vendas:
                cli = v.get("clientes") or {}
                func = v.get("funcionarios") or {}
                items = v.get("itens_venda") or []

                prods_str = ", ".join(
                    f"{it.get('produtos', {}).get('nome', 'Item')} ({it.get('quantidade')}x)"
                    for it in items if it.get("produtos")
                ) or "Venda sem itens detalhados"

                tot_qtd = sum(int(it.get("quantidade") or 0) for it in items)

                relatorio.append({
                    "id": v["id"],
                    "data": (v.get("created_at") or "")[:10],
                    "hora": (v.get("created_at") or "")[11:16],
                    "cliente": cli.get("nome", "Desconhecido"),
                    "telefone": cli.get("telefone", "-"),
                    "funcionario": func.get("nome", "Desconhecido"),
                    "produtos": prods_str,
                    "quantidade_total": tot_qtd,
                    "valor_total": float(v.get("valor_total") or 0),
                })

            return Response(relatorio)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
