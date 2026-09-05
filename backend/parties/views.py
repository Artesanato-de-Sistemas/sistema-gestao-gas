import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsAdmin, IsColaborador
from config.supabase_client import SupabaseViewSet, supabase

logger = logging.getLogger(__name__)


class ClienteViewSet(SupabaseViewSet):
    table_name = "clientes"
    permission_classes = [IsColaborador]

    def list(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            # 1. Busca clientes
            query = supabase.table("clientes").select("*").order("nome")
            res = query.execute()
            clients = res.data or []

            # 2. Busca totais de vendas por cliente
            vendas_res = supabase.table("vendas").select("id_cliente, valor_total").is_("deleted_at", "null").execute()
            vendas_map = {}
            for v in (vendas_res.data or []):
                cid = str(v.get("id_cliente"))
                vendas_map[cid] = vendas_map.get(cid, 0.0) + float(v.get("valor_total") or 0)

            # 3. Busca totais de pagamentos por cliente
            pagamentos_res = supabase.table("pagamentos").select("id_cliente, valor").execute()
            pagamentos_map = {}
            for p in (pagamentos_res.data or []):
                cid = str(p.get("id_cliente"))
                pagamentos_map[cid] = pagamentos_map.get(cid, 0.0) + float(p.get("valor") or 0)

            search = request.query_params.get("search", "").strip().lower()
            apenas_com_debito = request.query_params.get("apenas_com_debito", "").lower() in ("true", "1")

            enriched = []
            for c in clients:
                cid = str(c["id"])
                tot_vendas = round(vendas_map.get(cid, 0.0), 2)
                tot_pago = round(pagamentos_map.get(cid, 0.0), 2)
                saldo_devedor = round(max(0.0, tot_vendas - tot_pago), 2)

                c["total_vendas"] = tot_vendas
                c["total_pago"] = tot_pago
                c["saldo_devedor"] = saldo_devedor
                c["isInadimplente"] = saldo_devedor > 0

                # Filtro por busca de texto
                if search:
                    name_match = search in (c.get("nome") or "").lower()
                    doc_match = search in (c.get("cpf_cnpj") or "").lower()
                    phone_match = search in (c.get("telefone") or "").lower()
                    bairro_match = search in (c.get("bairro") or "").lower()
                    if not (name_match or doc_match or phone_match or bairro_match):
                        continue

                # Filtro por inadimplente
                if apenas_com_debito and saldo_devedor <= 0:
                    continue

                enriched.append(c)

            return Response(enriched)
        except Exception as e:
            logger.error(f"Erro ao listar clientes: {e}")
            return Response({"error": str(e)}, status=500)

    def create(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = dict(request.data)
        if not data.get("nome"):
            return Response({"error": "Nome do cliente é obrigatório."}, status=400)

        payload = {
            "nome": data.get("nome", "").strip(),
            "cpf_cnpj": data.get("cpf_cnpj") or None,
            "telefone": data.get("telefone") or None,
            "rua_numero": data.get("rua_numero") or None,
            "bairro": data.get("bairro") or None,
            "cidade": data.get("cidade") or "Cataguases",
            "limite_credito": float(data.get("limite_credito") or 0.0),
        }
        if request.user and request.user.is_authenticated and getattr(request.user, "id", None):
            payload["created_by"] = request.user.id

        try:
            res = supabase.table("clientes").insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar cliente."}, status=500)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=["get"])
    def historico(self, request, pk=None):
        """Retorna histórico completo do cliente: vendas, pagamentos, débitos e preços específicos."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            # 1. Dados do cliente
            cli_res = supabase.table("clientes").select("*").eq("id", pk).execute()
            if not cli_res.data:
                return Response({"error": "Cliente não encontrado."}, status=404)
            client = cli_res.data[0]

            # 2. Vendas do cliente
            vendas_res = (
                supabase.table("vendas")
                .select("*, funcionarios(nome), itens_venda(*, produtos(nome))")
                .eq("id_cliente", pk)
                .is_("deleted_at", "null")
                .order("created_at", desc=True)
                .execute()
            )
            vendas = vendas_res.data or []

            # 3. Pagamentos do cliente
            pagamentos_res = (
                supabase.table("pagamentos")
                .select("*")
                .eq("id_cliente", pk)
                .order("created_at", desc=True)
                .execute()
            )
            pagamentos = pagamentos_res.data or []

            # 4. Preços específicos configurados
            precos_res = (
                supabase.table("valor_cliente")
                .select("*, produtos(nome, valor_padrao)")
                .eq("id_cliente", pk)
                .execute()
            )
            precos = precos_res.data or []

            total_vendas = sum(float(v.get("valor_total") or 0) for v in vendas)
            total_pago = sum(float(p.get("valor") or 0) for p in pagamentos)
            saldo_devedor = round(max(0.0, total_vendas - total_pago), 2)

            return Response({
                "cliente": client,
                "total_vendas": round(total_vendas, 2),
                "total_pago": round(total_pago, 2),
                "saldo_devedor": saldo_devedor,
                "vendas": vendas,
                "pagamentos": pagamentos,
                "precos_especificos": precos,
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=["get", "post"], url_path="precos")
    def precos(self, request, pk=None):
        """Lista ou define preços específicos para um cliente."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        if request.method == "GET":
            try:
                res = (
                    supabase.table("valor_cliente")
                    .select("*, produtos(nome, valor_padrao)")
                    .eq("id_cliente", pk)
                    .execute()
                )
                return Response(res.data or [])
            except Exception as e:
                return Response({"error": str(e)}, status=500)

        # POST: salva ou atualiza valor específico
        id_produto = request.data.get("id_produto")
        valor_especifico = request.data.get("valor_especifico")
        if not id_produto or valor_especifico is None:
            return Response({"error": "id_produto e valor_especifico são obrigatórios."}, status=400)

        try:
            # Verifica se já existe preço configurado para esse par (cliente, produto)
            existing = (
                supabase.table("valor_cliente")
                .select("id")
                .eq("id_cliente", pk)
                .eq("id_produto", id_produto)
                .execute()
            )
            if existing.data and len(existing.data) > 0:
                rec_id = existing.data[0]["id"]
                res = (
                    supabase.table("valor_cliente")
                    .update({"valor_especifico": float(valor_especifico)})
                    .eq("id", rec_id)
                    .execute()
                )
            else:
                res = (
                    supabase.table("valor_cliente")
                    .insert({
                        "id_cliente": pk,
                        "id_produto": id_produto,
                        "valor_especifico": float(valor_especifico),
                    })
                    .execute()
                )
            return Response(res.data[0] if res.data else {}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class FuncionarioViewSet(viewsets.ViewSet):
    """
    Lista funcionários para seleção nas telas operacionais e gestão de usuários (Admin).
    """

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsColaborador()]
        return [IsAdmin()]

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            # Oculta o campo 'senha' por segurança na resposta
            res = (
                supabase.table("funcionarios")
                .select("id, nome, email, cpf, telefone, role, ativo, created_at")
                .order("nome")
                .execute()
            )
            return Response(res.data or [])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = (
                supabase.table("funcionarios")
                .select("id, nome, email, cpf, telefone, role, ativo, created_at")
                .eq("id", pk)
                .execute()
            )
            if not res.data:
                return Response({"error": "Funcionário não encontrado."}, status=404)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        data = request.data
        if not data.get("nome") or not data.get("email") or not data.get("senha"):
            return Response({"error": "Nome, email e senha são obrigatórios."}, status=400)

        payload = {
            "nome": data["nome"].strip(),
            "email": data["email"].strip().lower(),
            "senha": str(data["senha"]),
            "cpf": data.get("cpf") or None,
            "telefone": data.get("telefone") or None,
            "role": data.get("role", "VENDEDOR").upper(),
            "ativo": data.get("ativo", True),
        }
        try:
            res = supabase.table("funcionarios").insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar funcionário."}, status=500)
            created = res.data[0]
            created.pop("senha", None)
            return Response(created, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def partial_update(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        allowed = {"nome", "cpf", "telefone", "role", "ativo", "senha"}
        payload = {k: v for k, v in request.data.items() if k in allowed}
        if not payload:
            return Response({"error": "Nenhum campo válido para atualizar."}, status=400)
        try:
            res = supabase.table("funcionarios").update(payload).eq("id", pk).execute()
            if not res.data:
                return Response({"error": "Funcionário não encontrado."}, status=404)
            updated = res.data[0]
            updated.pop("senha", None)
            return Response(updated)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            # Soft inativação
            supabase.table("funcionarios").update({"ativo": False}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ValorClienteViewSet(SupabaseViewSet):
    table_name = "valor_cliente"
    permission_classes = [IsColaborador]
