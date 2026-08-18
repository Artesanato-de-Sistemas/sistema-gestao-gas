# Documentação Oficial da API (Django REST Framework)

Esta documentação define o contrato atual entre o frontend (React) e o backend (Django). Os endpoints abaixo cobrem o *core business* do ERP Império do Gás.

## Módulo: Clientes (Clients)
Gerencia os dados de compradores e seus respectivos endereços.

### `GET /api/clients/`
* **Descrição:** Retorna a lista de todos os clientes ativos.
* **Resposta de Sucesso (200 OK):**
```json
  [
    {
      "id": "uuid",
      "name": "string",
      "document": "string",
      "phone": "string",
      "active": true
    }
  ]
```

### `POST /api/clients/`

* **Descrição:** Cadastra um novo cliente. O payload aceita os dados de endereço embutidos para uma criação atômica.
* **Payload Esperado:**
```json
{
  "name": "Nome do Cliente",
  "document": "12345678901",
  "phone": "32999999999",
  "address": {
    "street": "Rua Principal",
    "number": "100",
    "neighborhood": "Centro"
  }
}

```

### `PUT /api/clients/{id}/` | `DELETE /api/clients/{id}/`

* **Descrição:** Atualiza os dados cadastrais ou inativa o cliente (Soft Delete).

---

## Módulo: Entregadores (Delivery Drivers)

Gerencia os profissionais responsáveis pela entrega e suas comissões.

### `GET /api/drivers/`

* **Descrição:** Retorna a lista de todos os entregadores cadastrados e ativos.

### `POST /api/drivers/`

* **Descrição:** Cadastra um novo entregador.
* **Payload Esperado:**
```json
{
  "name": "Nome do Entregador",
  "document": "10987654321",
  "phone": "32988888888",
  "commission_percentage": 5.0
}

```

## Módulo: Produtos (Products)

Catálogo de itens comercializáveis, como vasilhames cheios, vazios, água, etc.

### `GET /api/products/`

* **Descrição:** Retorna o catálogo completo, incluindo a quantidade atual em estoque.

### `POST /api/products/`

* **Descrição:** Registra um novo tipo de produto.
* **Payload Esperado:**
```json
{
  "name": "Gás de Cozinha 13kg (Cheio)",
  "category": "GLP",
  "current_price": 105.00
}

```

## Módulo: Entradas de Estoque (Inbounds)

Gerencia o recebimento de caminhões e a recarga do estoque físico da distribuidora.

### `GET /api/inbounds/`

* **Descrição:** Lista o histórico de caminhões recebidos e status da carga.

### `POST /api/inbounds/`

* **Descrição:** Registra a chegada de uma carga, criando o cabeçalho da nota e inserindo seus respectivos itens no estoque.
* **Payload Esperado:**
```json
{
  "invoice_number": "NF-12345",
  "truck_plate": "ABC-1234",
  "items": [
    {
      "product_id": "uuid-do-produto",
      "quantity": 100,
      "unit_cost": 75.00
    }
  ]
}

```

## Módulo: Pedidos e Vendas (Orders)

O coração da operação transacional, responsável por vincular clientes, entregadores e produtos.

### `GET /api/orders/`

* **Descrição:** Lista o histórico de pedidos, exibindo o status atual (ABERTO, FINALIZADO) e valores totais.

### `POST /api/orders/`

* **Descrição:** Processa uma nova venda. Exige a vinculação direta de um cliente e de um entregador.
* **Payload Esperado:**
```json
{
  "client_id": "uuid-do-cliente",
  "delivery_driver_id": "uuid-do-entregador",
  "sale_type": "ENTREGA",
  "items": [
    {
      "product_id": "uuid-do-gas-cheio",
      "quantity": 1,
      "unit_price": 110.00
    }
  ]
}

```

### `POST /api/orders/{id}/receipts/`

* **Descrição:** Registra um pagamento (recebimento) em um pedido existente.
* **Payload Esperado:**
```json
{
  "payment_method": "PIX",
  "amount": 110.00,
  "notes": "Pagamento efetuado na entrega"
}

```