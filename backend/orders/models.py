import uuid
from django.db import models
from parties.models import Client, DeliveryDriver

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relacionamentos
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        db_column="client_id", 
        null=True, 
        blank=True
    )
    delivery_driver = models.ForeignKey(
        DeliveryDriver, 
        on_delete=models.CASCADE, 
        db_column="delivery_driver_id", 
        null=True, 
        blank=True
    )
    
    # Novos campos da venda
    date = models.DateField(null=True, blank=True)  # Data da venda
    product = models.TextField(null=True, blank=True)  # Nome do produto (ex: "P13 - Gas")
    unit_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )  # Preço unitário
    quantity = models.IntegerField(null=True, blank=True)  # Quantidade vendida
    
    # Campos de pagamento
    payment_form = models.TextField(null=True, blank=True)  # DINHEIRO, PIX, CREDITO, DEBITO, A PRAZO (VENDA)
    payment_received = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        default=0
    )  # Valor já recebido
    
    # Campos existentes
    status = models.TextField(null=True, blank=True)  # ENTREGUE, ABERTO, CANCELADO
    sale_type = models.TextField(null=True, blank=True)  # Manter para compatibilidade
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )  # Valor total (quantity * unit_cost)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        managed = False  # Mantém False pois estamos usando Supabase
        db_table = "orders"

    def __str__(self):
        return f"Order {self.id} - {self.client}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        db_column="order_id", 
        null=True, 
        blank=True
    )
    # Nota: Agora o product pode ser um TextField se não tivermos uma tabela de produtos
    # Ou manter como ForeignKey se tivermos
    product = models.TextField(null=True, blank=True)  # Mudar para TextField se não tiver tabela products
    quantity = models.IntegerField(null=True, blank=True)
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    # Campos adicionais que podem ser úteis
    subtotal = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )

    class Meta:
        managed = False
        db_table = "order_items"

    def __str__(self):
        return f"Item {self.id} - Order {self.order_id}"