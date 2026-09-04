from rest_framework import serializers

from .models import Order, OrderItem

class OrderWorksheetSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    client_id = serializers.UUIDField()
    client_name = serializers.SerializerMethodField()
    product = serializers.CharField()
    quantity = serializers.IntegerField()
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_form = serializers.CharField()
    date = serializers.DateField()
    
    def get_client_name(self, obj):
        return obj.get('clients', {}).get('name') if obj.get('clients') else None

class PaymentWorksheetSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    client_id = serializers.UUIDField()
    client_name = serializers.SerializerMethodField()
    order_id = serializers.UUIDField(required=False, allow_null=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_null=True)
    
    def get_client_name(self, obj):
        return obj.get('clients', {}).get('name') if obj.get('clients') else None

class CashEntryWorksheetSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    type = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField()
    date = serializers.DateField()
    category = serializers.CharField(required=False, allow_null=True)

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source="orderitem_set")

    class Meta:
        model = Order
        fields = "__all__"
