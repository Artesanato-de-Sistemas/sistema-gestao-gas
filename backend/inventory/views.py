from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from config.supabase_client import SupabaseViewSet, supabase
from .models import Product, StockMovement
from .serializers import ProductSerializer, StockMovementSerializer


# --------------------------------------------------------------------------- #
# Mapeamento: categoria -> nome amigável do produto
# --------------------------------------------------------------------------- #
CATEGORY_NAMES = {
    'GLP_13KG_CHEIO': 'P13 Cheio',
    'GLP_13KG_VAZIO': 'P13 Vazio (Casco)',
    'GLP_20KG_CHEIO': 'P20 Cheio',
    'GLP_20KG_VAZIO': 'P20 Vazio (Casco)',
    'GLP_45KG_CHEIO': 'P45 Cheio',
    'GLP_45KG_VAZIO': 'P45 Vazio (Casco)',
}


def get_stock_summary():
    """
    Como a tabela products está vazia no Supabase e o inventário real
    está nos inbound_items, calculamos o saldo por categoria.
    """
    if not supabase:
        return []
    try:
        res = supabase.table('inbound_items').select('category, available_quantity').execute()
        items = res.data or []
    except Exception:
        return []

    summary = {}
    for item in items:
        cat = item.get('category', '')
        qty = item.get('available_quantity', 0) or 0
        if cat not in summary:
            summary[cat] = {
                'id': cat,                        # usa categoria como ID virtual
                'name': CATEGORY_NAMES.get(cat, cat),
                'category': cat,
                'stock_quantity': 0,
                'current_price': 0,
                'active': True,
                'updated_at': None,
            }
        summary[cat]['stock_quantity'] += qty

    return list(summary.values())


class ProductViewSet(SupabaseViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    table_name = 'products'

    def list(self, request, *args, **kwargs):
        """
        Lista estoque calculado a partir dos inbound_items (categoria/disponível).
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            stock = get_stock_summary()
            return Response(stock)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['get', 'post'], url_path='movements')
    def movements(self, request, pk=None):
        """
        GET /api/products/{category}/movements/  — lista movimentos da categoria.
        POST /api/products/{category}/movements/ — registra ajuste manual de estoque.
        pk aqui é a CATEGORIA (ex: GLP_13KG_CHEIO).
        """
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        category = pk  # pk é a categoria

        if request.method == 'GET':
            res = supabase.table('stock_movements').select('*').execute()
            # Filtra por notes contendo a categoria como proxy
            data = [m for m in (res.data or []) if category in (m.get('notes') or '')]
            return Response(data)

        # POST — registra ajuste de estoque nos inbound_items disponíveis
        data = request.data
        movement_type = data.get('movement_type', 'AJUSTE')
        quantity = int(data.get('quantity', 0))
        notes = data.get('notes', '')

        try:
            # Registra movimentação
            mv_payload = {
                "movement_type": movement_type,
                "quantity": quantity,
                "notes": f"[{category}] {notes}" if notes else f"[{category}] Ajuste manual",
            }
            mv_res = supabase.table('stock_movements').insert(mv_payload).execute()

            return Response(
                mv_res.data[0] if mv_res.data else mv_payload,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class StockMovementViewSet(SupabaseViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    table_name = 'stock_movements'


class StockMovementsListView(APIView):
    """GET /api/stock/movements/ — histórico global de movimentações."""
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table('stock_movements').select('*').order('created_at', desc=True).execute()
            return Response(res.data or [])
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class InboundView(APIView):
    """
    GET  /api/inbounds/  — lista entradas.
    POST /api/inbounds/  — registra um lote de entrada de botijões.

    Schema real da tabela inbounds:
      id, invoice_number, truck_plate, status, created_by, created_at, finalized_at, total_amount

    Schema real da tabela inbound_items:
      id, inbound_id, quantity, unit_cost, category, available_quantity, subtotal
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table('inbounds').select('*, inbound_items(*)').order('created_at', desc=True).execute()
            return Response(res.data or [])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        truck_plate = request.data.get('truckPlate', '')
        invoice_number = request.data.get('invoice', '')
        items = request.data.get('items', [])

        if not truck_plate or not invoice_number:
            return Response({"error": "Placa e Nota Fiscal são obrigatórios."}, status=400)
        if not items:
            return Response({"error": "Ao menos um item é obrigatório."}, status=400)

        try:
            total_amount = sum(
                float(i.get('quantity', 0)) * float(i.get('unit_cost', 0))
                for i in items
            )

            # 1. Cria cabeçalho da entrada
            inbound_payload = {
                "truck_plate": truck_plate,
                "invoice_number": invoice_number,
                "status": "FINALIZADO",
                "total_amount": total_amount,
            }
            inb_res = supabase.table('inbounds').insert(inbound_payload).execute()
            if not inb_res.data:
                return Response({"error": "Erro ao criar registro de entrada."}, status=500)

            inbound_id = inb_res.data[0]['id']
            processed = []

            for item in items:
                category = item.get('category', '')
                quantity = int(item.get('quantity', 0))
                unit_cost = float(item.get('unit_cost', 0))
                subtotal = quantity * unit_cost

                # 2. Insere item de entrada (subtotal é coluna gerada pelo banco)
                item_payload = {
                    "inbound_id": inbound_id,
                    "category": category,
                    "quantity": quantity,
                    "unit_cost": unit_cost,
                    "available_quantity": quantity,   # inicialmente tudo disponível
                }
                supabase.table('inbound_items').insert(item_payload).execute()

                # 3. Registra movimentação no histórico
                mv_payload = {
                    "movement_type": "ENTRADA",
                    "quantity": quantity,
                    "notes": f"[{category}] NF {invoice_number} | Placa {truck_plate}",
                }
                try:
                    supabase.table('stock_movements').insert(mv_payload).execute()
                except Exception:
                    pass  # movimentação é auditoria, não deve bloquear

                processed.append({
                    "category": category,
                    "name": CATEGORY_NAMES.get(category, category),
                    "quantity": quantity,
                    "subtotal": subtotal,
                })

            return Response({
                "inbound_id": inbound_id,
                "invoice_number": invoice_number,
                "truck_plate": truck_plate,
                "total_amount": total_amount,
                "processed": processed,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
