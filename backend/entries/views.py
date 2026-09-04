# backend/entries/views.py
import logging
import traceback
from datetime import datetime
from decimal import Decimal
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from config.supabase_client import supabase

logger = logging.getLogger(__name__)

class EntryViewSet(viewsets.ViewSet):
    """
    ViewSet para gerenciar entradas do dia (vendas, pagamentos, sangrias)
    """
    
    @action(detail=False, methods=['get'], url_path='check')
    def check_entry(self, request):
        """
        Verifica se já existe entrada para um funcionário em uma data específica.
        Query params: driver_id, date (YYYY-MM-DD)
        """
        driver_id = request.query_params.get('driver_id')
        date = request.query_params.get('date')
        
        if not driver_id or not date:
            return Response({"error": "driver_id e date são obrigatórios"}, status=400)
        
        try:
            # Verificar se há vendas para este funcionário nesta data
            orders_res = (
                supabase.table("orders")
                .select("id")
                .eq("delivery_driver_id", driver_id)
                .eq("date", date)
                .limit(1)
                .execute()
            )
            
            has_orders = len(orders_res.data) > 0
            
            # Verificar se há pagamentos
            payments_res = (
                supabase.table("payments")
                .select("id")
                .eq("delivery_driver_id", driver_id)
                .eq("date", date)
                .limit(1)
                .execute()
            )
            has_payments = len(payments_res.data) > 0
            
            # Verificar se há sangrias
            cash_res = (
                supabase.table("cash_entries")
                .select("id")
                .eq("delivery_driver_id", driver_id)
                .eq("date", date)
                .limit(1)
                .execute()
            )
            has_cash = len(cash_res.data) > 0
            
            has_entry = has_orders or has_payments or has_cash
            
            return Response({
                "has_entry": has_entry,
                "has_orders": has_orders,
                "has_payments": has_payments,
                "has_cash": has_cash,
                "message": "Esta data já possui lançamentos para este funcionário" if has_entry else "Nenhum lançamento encontrado"
            })
            
        except Exception as e:
            logger.error(f"ERRO ao verificar entrada: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=['post'], url_path='save')
    def save_entry(self, request):
        """
        Salva todas as informações da entrada (vendas, pagamentos, sangrias).
        Payload esperado:
        {
            "driver_id": "uuid",
            "date": "2026-09-02",
            "orders": [
                {
                    "client_id": "uuid",
                    "product": "P13 - Gas",
                    "unit_cost": 94.50,
                    "quantity": 10,
                    "payment_form": "DINHEIRO"
                }
            ],
            "payments": [
                {
                    "client_id": "uuid",
                    "amount": 7000.00,
                    "payment_method": "DINHEIRO",
                    "notes": "Pagamento do Jeferson"
                }
            ],
            "cash_entries": [
                {
                    "type": "SAIDA",
                    "amount": 25.00,
                    "description": "Almoço",
                    "category": "Alimentação"
                }
            ]
        }
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        
        driver_id = request.data.get('driver_id')
        date = request.data.get('date')
        orders_data = request.data.get('orders', [])
        payments_data = request.data.get('payments', [])
        cash_data = request.data.get('cash_entries', [])
        
        if not driver_id:
            return Response({"error": "driver_id é obrigatório"}, status=400)
        if not date:
            return Response({"error": "date é obrigatório"}, status=400)
        
        try:
            # Validar data
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return Response({"error": "date deve estar no formato YYYY-MM-DD"}, status=400)
        
        # Verificar se já existe entrada para este funcionário/data
        try:
            orders_check = supabase.table("orders").select("id").eq("delivery_driver_id", driver_id).eq("date", date).limit(1).execute()
            payments_check = supabase.table("payments").select("id").eq("delivery_driver_id", driver_id).eq("date", date).limit(1).execute()
            cash_check = supabase.table("cash_entries").select("id").eq("delivery_driver_id", driver_id).eq("date", date).limit(1).execute()
            
            if len(orders_check.data) > 0 or len(payments_check.data) > 0 or len(cash_check.data) > 0:
                return Response({
                    "error": "Já existem lançamentos para este funcionário nesta data. Não é possível adicionar mais."
                }, status=400)
        except Exception as e:
            logger.error(f"ERRO ao verificar entrada existente: {str(e)}")
        
        saved_data = {
            "orders": [],
            "payments": [],
            "cash_entries": []
        }
        
        try:
            # 1. Salvar ORDERS (vendas)
            for order in orders_data:
                quantity = int(order.get('quantity', 0))
                unit_cost = float(order.get('unit_cost', 0))
                total_amount = quantity * unit_cost
                payment_form = order.get('payment_form')
                payment_received = total_amount if payment_form != 'A PRAZO (VENDA)' else 0
                
                order_payload = {
                    "client_id": order.get('client_id'),
                    "delivery_driver_id": driver_id,
                    "date": date,
                    "product": order.get('product'),
                    "unit_cost": unit_cost,
                    "quantity": quantity,
                    "payment_form": payment_form,
                    "payment_received": payment_received,
                    "total_amount": total_amount,
                    "status": "ENTREGUE"
                }
                
                result = supabase.table("orders").insert(order_payload).execute()
                if result.data:
                    saved_data["orders"].append(result.data[0])
            
            # 2. Salvar PAYMENTS (pagamentos)
            for payment in payments_data:
                payment_payload = {
                    "client_id": payment.get('client_id'),
                    "delivery_driver_id": driver_id,
                    "date": date,
                    "amount": float(payment.get('amount', 0)),
                    "payment_method": payment.get('payment_method'),
                    "notes": payment.get('notes', ''),
                    "order_id": payment.get('order_id')  # Opcional
                }
                
                result = supabase.table("payments").insert(payment_payload).execute()
                if result.data:
                    saved_data["payments"].append(result.data[0])
            
            # 3. Salvar CASH_ENTRIES (sangrias)
            for cash in cash_data:
                cash_payload = {
                    "delivery_driver_id": driver_id,
                    "date": date,
                    "type": cash.get('type'),
                    "amount": float(cash.get('amount', 0)),
                    "description": cash.get('description', ''),
                    "category": cash.get('category', '')
                }
                
                result = supabase.table("cash_entries").insert(cash_payload).execute()
                if result.data:
                    saved_data["cash_entries"].append(result.data[0])
            
            return Response({
                "success": True,
                "message": f"Entrada salva com sucesso! {len(saved_data['orders'])} vendas, {len(saved_data['payments'])} pagamentos, {len(saved_data['cash_entries'])} movimentações.",
                "data": saved_data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"ERRO ao salvar entrada: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({"error": str(e)}, status=500)