import uuid

from django.db import models


class Produto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.TextField()
    categoria = models.TextField(null=True, blank=True)
    valor_padrao = models.DecimalField(max_digits=10, decimal_places=2)
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "produtos"


class Entrada(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_produto = models.UUIDField()
    quantidade_inicial = models.IntegerField()
    quantidade_atual = models.IntegerField()
    placa_caminhao = models.TextField(null=True, blank=True)
    lote_nf = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "entradas"


class Saida(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_entrada = models.UUIDField()
    id_produto = models.UUIDField()
    id_venda = models.UUIDField(null=True, blank=True)
    tipo = models.TextField()
    quantidade = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "saidas"
