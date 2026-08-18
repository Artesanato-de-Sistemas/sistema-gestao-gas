import uuid

from django.db import models


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.TextField()
    category = models.TextField(null=True, blank=True)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, null=True, blank=True)
    stock_quantity = models.IntegerField(default=0, null=True, blank=True)
    active = models.BooleanField(default=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "products"


class StockMovement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column="product_id", null=True, blank=True)
    movement_type = models.TextField()
    quantity = models.IntegerField()
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "stock_movements"
