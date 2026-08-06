from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from config.supabase_client import SupabaseViewSet, supabase
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer


class OrderViewSet(viewsets.ViewSet):
    """
    ViewSet para pedidos. Bypassa o ORM Django completamente e usa o Supabase SDK.

    GET  /api/orders/        — lista todos os pedidos com nome de cliente/entregador.
    POST /api/orders/        — cria pedido com itens, calcula total_amount.
    GET  /api/orders/{id}/   — detalhe de um pedido com itens.

    Lógica de produto:
    - O frontend envia product_id como a CATEGORIA (ex: "GLP_13KG_CHEIO")
    - O backend busca inbound_items por categoria com available_quantity > 0
    - Insere order_items com inbound_item_id (UUID) e decrementa available_quantity
    """

    def list(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            # Busca pedidos com itens via join PostgREST
            res = supabase.table('orders').select(
                '*, clients(name, trade_name), delivery_drivers(name), order_items(*)'
            ).order('created_at', desc=True).execute()
            orders = res.data or []

            # Flatten nomes de cliente/entregador para o frontend
            for order in orders:
                client_data = order.pop('clients', None)
                driver_data = order.pop('delivery_drivers', None)
                order['client_name'] = (
                    (client_data.get('trade_name') or client_data.get('name')) if client_data else None
                )
                order['driver_name'] = driver_data.get('name') if driver_data else None
                # Renomeia order_items para items
                raw_items = order.pop('order_items', [])
                items_enriched = []
                for item in raw_items:
                    # Enriquece com category do inbound_item se disponível
                    inbound_item_id = item.get('inbound_item_id')
                    category = item.get('category', '')
                    if inbound_item_id and not category:
                        try:
                            ib_res = supabase.table('inbound_items').select('category').eq('id', inbound_item_id).execute()
                            if ib_res.data:
                                category = ib_res.data[0].get('category', '')
                        except Exception:
                            pass
                    item['product_name'] = category or item.get('product_id') or ''
                    item['subtotal'] = float(item.get('unit_price') or 0) * int(item.get('quantity') or 0)
                    items_enriched.append(item)
                order['items'] = items_enriched

            return Response(orders)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table('orders').select(
                '*, clients(name, trade_name), delivery_drivers(name), order_items(*)'
            ).eq('id', pk).execute()
            if not res.data:
                return Response({"error": "Pedido não encontrado."}, status=404)
            order = res.data[0]
            client_data = order.pop('clients', None)
            driver_data = order.pop('delivery_drivers', None)
            order['client_name'] = (
                (client_data.get('trade_name') or client_data.get('name')) if client_data else None
            )
            order['driver_name'] = driver_data.get('name') if driver_data else None
            order['items'] = order.pop('order_items', [])
            for item in order['items']:
                item['product_name'] = item.get('category') or item.get('product_id') or ''
                item['subtotal'] = float(item.get('unit_price') or 0) * int(item.get('quantity') or 0)
            return Response(order)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request):
        """
        Payload esperado do frontend:
        {
            "client_id": "uuid",
            "delivery_driver_id": "uuid" | null | "none",
            "sale_type": "AVISTA" | "FIADO" | "CARTAO",
            "items": [
                {"product_id": "GLP_13KG_CHEIO", "quantity": 2, "unit_price": 85.00}
            ]
        }

        product_id no frontend = CATEGORIA do inbound_item (ex: "GLP_13KG_CHEIO").
        O backend resolve para o inbound_item_id correto via available_quantity.
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        client_id = request.data.get('client_id')
        delivery_driver_id = request.data.get('delivery_driver_id')
        sale_type = request.data.get('sale_type', 'AVISTA')
        items = request.data.get('items', [])

        if not client_id:
            return Response({"error": "client_id é obrigatório."}, status=400)
        if not items:
            return Response({"error": "Ao menos um item é obrigatório."}, status=400)

        try:
            # Calcula total
            total_amount = sum(
                float(i.get('unit_price', 0)) * int(i.get('quantity', 0))
                for i in items
            )

            # Status baseado no tipo de venda
            status_order = 'ABERTO' if sale_type == 'FIADO' else 'ENTREGUE'

            # 1. Cria o pedido
            order_payload = {
                "client_id": client_id,
                "sale_type": sale_type,
                "status": status_order,
                "total_amount": total_amount,
            }
            if delivery_driver_id and delivery_driver_id != 'none':
                order_payload["delivery_driver_id"] = delivery_driver_id

            order_res = supabase.table('orders').insert(order_payload).execute()
            if not order_res.data:
                return Response({"error": "Erro ao criar pedido."}, status=500)

            order_id = order_res.data[0]['id']

            # 2. Insere itens do pedido, resolvendo category -> inbound_item_id
            created_items = []
            allocation_errors = []

            for item in items:
                category = item.get('product_id', '')  # frontend envia categoria como product_id
                quantity_needed = int(item.get('quantity', 0))
                unit_price = float(item.get('unit_price', 0))

                if quantity_needed <= 0:
                    continue

                # Busca inbound_items disponíveis por categoria (FIFO: mais antigos primeiro)
                ib_res = supabase.table('inbound_items').select('id, available_quantity, category').eq(
                    'category', category
                ).gt('available_quantity', 0).order('id').execute()

                available_items = ib_res.data or []

                # Aloca o estoque necessário (pode vir de múltiplos inbound_items)
                remaining = quantity_needed
                for ib in available_items:
                    if remaining <= 0:
                        break

                    ib_id = ib['id']
                    ib_avail = ib['available_quantity']
                    allocate = min(remaining, ib_avail)

                    # Insere order_item com inbound_item_id
                    item_payload = {
                        "order_id": order_id,
                        "inbound_item_id": ib_id,
                        "quantity": allocate,
                        "unit_price": unit_price,
                    }
                    item_res = supabase.table('order_items').insert(item_payload).execute()

                    if item_res.data:
                        created_item = item_res.data[0]
                        created_item['product_name'] = category
                        created_item['category'] = category
                        created_item['subtotal'] = allocate * unit_price
                        created_items.append(created_item)

                        # Decrementa available_quantity no inbound_item (Invariante 3: estoque não fica negativo)
                        new_avail = ib_avail - allocate
                        supabase.table('inbound_items').update(
                            {"available_quantity": new_avail}
                        ).eq('id', ib_id).execute()

                    remaining -= allocate

                if remaining > 0:
                    allocation_errors.append(
                        f"Estoque insuficiente para {category}: faltam {remaining} unidades."
                    )

            if allocation_errors:
                # Rollback: cancela o pedido criado
                supabase.table('orders').update({"status": "CANCELADO"}).eq('id', order_id).execute()
                return Response({"error": " | ".join(allocation_errors)}, status=400)

            return Response({
                "id": order_id,
                "client_id": client_id,
                "delivery_driver_id": delivery_driver_id,
                "sale_type": sale_type,
                "status": status_order,
                "total_amount": total_amount,
                "items": created_items,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def partial_update(self, request, pk=None):
        """PATCH /api/orders/{id}/ — atualiza status do pedido."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            payload = {k: v for k, v in request.data.items() if k in ('status', 'sale_type', 'total_amount')}
            res = supabase.table('orders').update(payload).eq('id', pk).execute()
            if not res.data:
                return Response({"error": "Pedido não encontrado."}, status=404)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, pk=None):
        """DELETE /api/orders/{id}/ — cancela o pedido (soft)."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            supabase.table('orders').update({"status": "CANCELADO"}).eq('id', pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class OrderItemViewSet(SupabaseViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    table_name = 'order_items'
