# backend/entries/serializers.py
from rest_framework import serializers


class OrderEntrySerializer(serializers.Serializer):
    client_id = serializers.UUIDField()
    product = serializers.CharField()
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField()
    payment_form = serializers.CharField()

class PaymentEntrySerializer(serializers.Serializer):
    client_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    order_id = serializers.UUIDField(required=False, allow_null=True)

class CashEntrySerializer(serializers.Serializer):
    type = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField()
    category = serializers.CharField(required=False, allow_blank=True)
