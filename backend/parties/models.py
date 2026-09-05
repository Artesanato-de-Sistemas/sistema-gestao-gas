import uuid

from django.db import models


class Funcionario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.TextField()
    email = models.TextField(unique=True)
    senha = models.TextField()
    cpf = models.TextField(null=True, blank=True)
    telefone = models.TextField(null=True, blank=True)
    role = models.TextField(default="VENDEDOR")
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "funcionarios"


class Cliente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.TextField()
    cpf_cnpj = models.TextField(null=True, blank=True)
    telefone = models.TextField(null=True, blank=True)
    rua_numero = models.TextField(null=True, blank=True)
    bairro = models.TextField(null=True, blank=True)
    cidade = models.TextField(default="Cataguases", null=True, blank=True)
    limite_credito = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "clientes"


class ValorCliente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    id_cliente = models.UUIDField()
    id_produto = models.UUIDField()
    valor_especifico = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = "valor_cliente"
