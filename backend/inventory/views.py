from rest_framework import viewsets
from config.supabase_client import SupabaseViewSet
from .models import Product, StockMovement
from .serializers import ProductSerializer, StockMovementSerializer

class ProductViewSet(SupabaseViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    table_name = 'products'

class StockMovementViewSet(SupabaseViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    table_name = 'stock_movements'
