import uuid
from django.db import models
from parties.models import Client, DeliveryDriver
from inventory.models import Product

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id', null=True, blank=True)
    delivery_driver = models.ForeignKey(DeliveryDriver, on_delete=models.CASCADE, db_column='delivery_driver_id', null=True, blank=True)
    status = models.TextField(null=True, blank=True)
    sale_type = models.TextField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'orders'

class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, db_column='order_id', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='product_id', null=True, blank=True)
    quantity = models.IntegerField(null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'order_items'
