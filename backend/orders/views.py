# backend/orders/views.py
import logging
import traceback
from decimal import Decimal
from datetime import datetime
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from config.supabase_client import supabase

logger = logging.getLogger(__name__)

class OrderViewSet(viewsets.ViewSet):
    """
    ViewSet para pedidos usando Supabase diretamente.
    """

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        
        try:
            # Buscar pedidos com dados do cliente e entregador
            res = (
                supabase.table("orders")
                .select("*, clients(name), delivery_drivers(name)")
                .order("created_at", desc=True)
                .execute()
            )
            
            orders = res.data or []

            # Enriquecendo os dados
            for order in orders:
                client_data = order.pop("clients", None)
                driver_data = order.pop("delivery_drivers", None)
                order["client_name"] = client_data.get("name") if client_data else None
                order["driver_name"] = driver_data.get("name") if driver_data else None

            return Response(orders)
            
        except Exception as e:
            logger.error(f"ERRO ao listar pedidos: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        """
        Cria um novo pedido.
        Payload esperado:
        {
            "client_id": "uuid",
            "delivery_driver_id": "uuid" | null,
            "date": "2026-08-28",
            "product": "P13 - Gas",
            "unit_cost": 94.50,
            "quantity": 10,
            "payment_form": "DINHEIRO",
            "payment_received": 945.00
        }
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        # Validar campos obrigatórios
        required_fields = ["client_id", "product", "unit_cost", "quantity", "payment_form"]
        for field in required_fields:
            if not request.data.get(field):
                return Response(
                    {"error": f"Campo {field} é obrigatório."}, 
                    status=400
                )

        quantity = int(request.data.get("quantity", 0))
        if quantity <= 0:
            return Response(
                {"error": "Quantidade deve ser maior que 0."}, 
                status=400
            )

        unit_cost = float(request.data.get("unit_cost", 0))
        total_amount = quantity * unit_cost
        payment_received = float(request.data.get("payment_received", 0))

        # Se for pagamento a prazo, payment_received deve ser 0
        payment_form = request.data.get("payment_form")
        if payment_form == "A PRAZO (VENDA)" and payment_received > 0:
            payment_received = 0

        # Preparar payload
        payload = {
            "client_id": request.data.get("client_id"),
            "delivery_driver_id": request.data.get("delivery_driver_id") or None,
            "date": request.data.get("date", timezone.now().date().isoformat()),
            "product": request.data.get("product"),
            "unit_cost": unit_cost,
            "quantity": quantity,
            "payment_form": payment_form,
            "payment_received": payment_received,
            "total_amount": total_amount,
            "status": "ENTREGUE"
        }

        try:
            # Inserir pedido
            res = supabase.table("orders").insert(payload).execute()
            if not res.data:
                return Response(
                    {"error": "Erro ao criar pedido."}, 
                    status=500
                )

            order = res.data[0]
            
            # Buscar dados do cliente para resposta
            client_res = (
                supabase.table("clients")
                .select("name")
                .eq("id", order["client_id"])
                .execute()
            )
            if client_res.data:
                client = client_res.data[0]
                order["client_name"] = client.get("name")

            return Response(order, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"ERRO ao criar pedido: {str(e)}")
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = (
                supabase.table("orders")
                .select("*, clients(name), delivery_drivers(name)")
                .eq("id", pk)
                .execute()
            )
            if not res.data:
                return Response(
                    {"error": "Pedido não encontrado."}, 
                    status=404
                )
            
            order = res.data[0]
            client_data = order.pop("clients", None)
            driver_data = order.pop("delivery_drivers", None)
            order["client_name"] = client_data.get("name") if client_data else None
            order["driver_name"] = driver_data.get("name") if driver_data else None
            
            return Response(order)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def partial_update(self, request, pk=None):
        """Atualiza status ou informações de pagamento"""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        
        try:
            allowed_fields = ["status", "payment_received", "payment_form"]
            payload = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            if not payload:
                return Response(
                    {"error": "Nenhum campo válido para atualizar."}, 
                    status=400
                )
            
            if "payment_received" in payload:
                order_res = (
                    supabase.table("orders")
                    .select("total_amount")
                    .eq("id", pk)
                    .execute()
                )
                if order_res.data:
                    total = float(order_res.data[0].get("total_amount", 0))
                    if float(payload["payment_received"]) > total:
                        payload["payment_received"] = total
            
            res = supabase.table("orders").update(payload).eq("id", pk).execute()
            if not res.data:
                return Response(
                    {"error": "Pedido não encontrado."}, 
                    status=404
                )
            
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        """Cancela o pedido (soft delete)"""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            supabase.table("orders").update({"status": "CANCELADO"}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['get'], url_path='worksheet')
    def worksheet(self, request):
        """
        Endpoint para planilha do dia por funcionário.
        Query params:
            - driver_id: UUID do entregador
            - date: data no formato YYYY-MM-DD
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        driver_id = request.query_params.get('driver_id')
        date = request.query_params.get('date')

        if not driver_id:
            return Response({"error": "driver_id é obrigatório."}, status=400)
        if not date:
            return Response({"error": "date é obrigatório."}, status=400)

        try:
            # Validar formato da data
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return Response({"error": "date deve estar no formato YYYY-MM-DD."}, status=400)

        try:
            # 1. Buscar ORDERS do dia e funcionário
            orders_res = (
                supabase.table("orders")
                .select("*, clients(name)")
                .eq("delivery_driver_id", driver_id)
                .eq("date", date)
                .execute()
            )
            orders = orders_res.data or []

            # 2. Buscar PAYMENTS do dia e funcionário
            payments_res = (
                supabase.table("payments")
                .select("*, clients(name), orders(product)")
                .eq("delivery_driver_id", driver_id)
                .eq("date", date)
                .execute()
            )
            payments = payments_res.data or []

            # 3. Buscar CASH_ENTRIES do dia e funcionário
            cash_res = (
                supabase.table("cash_entries")
                .select("*")
                .eq("delivery_driver_id", driver_id)
                .eq("date", date)
                .execute()
            )
            cash_entries = cash_res.data or []

            # 4. Calcular totais financeiros
            totals = {
                "DINHEIRO": Decimal('0.00'),
                "PIX": Decimal('0.00'),
                "CREDITO": Decimal('0.00'),
                "DEBITO": Decimal('0.00'),
                "CHEQUE": Decimal('0.00'),
                "TOTAL": Decimal('0.00')
            }

            # Orders à vista (exclui "A PRAZO (VENDA)")
            for order in orders:
                payment_form = order.get("payment_form")
                if payment_form and payment_form != "A PRAZO (VENDA)":
                    amount = Decimal(str(order.get("total_amount", 0)))
                    if payment_form in totals:
                        totals[payment_form] += amount
                    totals["TOTAL"] += amount

            # Payments (todos são recebimentos efetivos)
            for payment in payments:
                method = payment.get("payment_method")
                amount = Decimal(str(payment.get("amount", 0)))
                if method in totals:
                    totals[method] += amount
                totals["TOTAL"] += amount

            # Formatar totais para float
            formatted_totals = {k: float(v) for k, v in totals.items()}

            return Response({
                "orders": orders,
                "payments": payments,
                "cash_entries": cash_entries,
                "totals": formatted_totals
            })

        except Exception as e:
            logger.error(f"ERRO ao buscar planilha: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({"error": str(e)}, status=500)


class OrderItemViewSet(viewsets.ViewSet):
    """ViewSet para itens de pedido"""
    
    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table("order_items").select("*").execute()
            return Response(res.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

@action(detail=False, methods=['get'], url_path='pending')
def pending_orders(self, request):
    """
    Busca vendas a prazo que ainda têm saldo pendente.
    Query params: client_id (opcional)
    """
    if not supabase:
        return Response({"error": "Supabase não configurado."}, status=500)
    
    client_id = request.query_params.get('client_id')
    
    try:
        # Buscar vendas a prazo
        query = supabase.table("orders").select("*, clients(name)")
        query = query.eq("payment_form", "A PRAZO")
        
        if client_id:
            query = query.eq("client_id", client_id)
        
        result = query.execute()
        orders = result.data or []
        
        # Calcular saldo pendente
        pending = []
        for order in orders:
            total = float(order.get("total_amount", 0))
            received = float(order.get("payment_received", 0))
            pending_amount = total - received
            
            if pending_amount > 0:
                client_data = order.pop("clients", None)
                pending.append({
                    "id": order.get("id"),
                    "client_id": order.get("client_id"),
                    "client_name": client_data.get("name") if client_data else None,
                    "product": order.get("product"),
                    "quantity": order.get("quantity"),
                    "total_amount": total,
                    "payment_received": received,
                    "pending_amount": pending_amount,
                    "date": order.get("date")
                })
        
        return Response(pending)
        
    except Exception as e:
        logger.error(f"ERRO ao buscar vendas pendentes: {str(e)}")
        return Response({"error": str(e)}, status=500)
