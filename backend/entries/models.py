import uuid

from django.db import models


class Pagamento(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_venda = models.UUIDField(null=True, blank=True)
    id_cliente = models.UUIDField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    forma_pagamento = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "pagamentos"


class Sangria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_funcionario = models.UUIDField()
    tipo = models.TextField()
    descricao = models.TextField()
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "sangrias"
