from rest_framework import viewsets
from config.supabase_client import SupabaseViewSet
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer

class OrderViewSet(SupabaseViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    table_name = 'orders'

class OrderItemViewSet(SupabaseViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    table_name = 'order_items'
