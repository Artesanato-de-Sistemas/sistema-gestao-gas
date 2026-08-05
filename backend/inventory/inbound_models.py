import uuid
from django.db import models
from inventory.models import Product


class Inbound(models.Model):
    """Representa o cabeçalho de uma Nota Fiscal de entrada."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    truck_plate = models.TextField(null=True, blank=True)
    invoice = models.TextField(null=True, blank=True)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'inbounds'


class InboundItem(models.Model):
    """Item de uma entrada, associado a um produto pelo category."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inbound = models.ForeignKey(Inbound, on_delete=models.CASCADE, db_column='inbound_id', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id', null=True, blank=True)
    category = models.TextField(null=True, blank=True)
    quantity = models.IntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'inbound_items'
