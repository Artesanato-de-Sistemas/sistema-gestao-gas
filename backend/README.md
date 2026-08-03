# Império do Gás — Backend API (Python/FastAPI)

Backend RESTful para o sistema de gestão da distribuidora de gás, migrado de Java (Spring Boot) para **Python 3.14 + FastAPI + Supabase**.

## Stack

| Componente     | Tecnologia                    |
|---------------|-------------------------------|
| Framework      | FastAPI 0.141+                |
| Runtime        | Python 3.14                   |
| Banco de Dados | Supabase (PostgreSQL)         |
| Auth           | Supabase Auth + JWT (jose)    |
| Validação      | Pydantic v2                   |
| Servidor       | Uvicorn                       |
| Testes         | Pytest + unittest.mock        |

## Estrutura do Projeto

```
backend/
├── app/
│   ├── main.py               # FastAPI app, CORS, exception handler
│   ├── api/                  # Routers (endpoints REST)
│   │   ├── auth.py           # POST /api/auth/login, GET /api/auth/me
│   │   ├── products.py       # CRUD produtos + movimentações por produto
│   │   ├── inbounds.py       # Registro de entradas (botijões)
│   │   ├── employees.py      # CRUD colaboradores
│   │   ├── clients.py        # CRUD clientes
│   │   ├── orders.py         # CRUD vendas/pedidos
│   │   ├── dashboard.py      # Métricas e relatório de entregadores
│   │   └── stock.py          # Histórico global de movimentações
│   ├── core/
│   │   ├── config.py         # Settings via pydantic-settings (.env)
│   │   ├── database.py       # Singleton do cliente Supabase
│   │   └── security.py       # JWT: create_access_token, decode_token
│   ├── schemas/
│   │   └── __init__.py       # Todos os modelos Pydantic v2
│   └── services/
│       ├── auth_service.py   # Login via Supabase Auth
│       ├── product_service.py
│       ├── inbound_service.py
│       ├── employee_service.py
│       ├── client_service.py
│       ├── order_service.py
│       └── dashboard_service.py
└── tests/
    ├── conftest.py           # Fixtures: TestClient + mock Supabase
    ├── test_health.py
    ├── test_inbounds.py      # Schema + service + endpoint tests
    ├── test_products.py
    ├── test_stock_movements.py
    └── test_security.py
```

## Setup

### 1. Criar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com sua SUPABASE_KEY (service_role key recomendada)
```

### 2. Criar ambiente virtual e instalar dependências

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Rodar o servidor de desenvolvimento

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

O servidor estará disponível em:
- API: `http://localhost:8080/api`
- Docs (Swagger): `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

### 4. Executar os testes

```bash
pytest tests/ -v
```

## Endpoints Disponíveis

| Método | Rota                                  | Descrição                                    |
|--------|---------------------------------------|----------------------------------------------|
| POST   | `/api/auth/login`                     | Login (email + senha via Supabase Auth)      |
| GET    | `/api/auth/me`                        | Usuário autenticado                          |
| GET    | `/api/products`                       | Listar produtos                              |
| POST   | `/api/products`                       | Criar produto                                |
| GET    | `/api/products/{id}`                  | Buscar produto                               |
| PATCH  | `/api/products/{id}`                  | Atualizar produto                            |
| GET    | `/api/products/{id}/movements`        | Histórico de movimentações do produto        |
| POST   | `/api/products/{id}/movements`        | Registrar movimentação de estoque            |
| GET    | `/api/stock/movements`                | Histórico global de movimentações            |
| GET    | `/api/inbounds`                       | Listar entradas de botijões                  |
| POST   | `/api/inbounds`                       | Registrar entrada (atualiza estoque + log)   |
| GET    | `/api/employees`                      | Listar colaboradores                         |
| POST   | `/api/employees`                      | Cadastrar colaborador                        |
| PATCH  | `/api/employees/{id}`                 | Atualizar colaborador                        |
| DELETE | `/api/employees/{id}`                 | Inativar colaborador (soft delete)           |
| GET    | `/api/clients`                        | Listar clientes                              |
| POST   | `/api/clients`                        | Cadastrar cliente                            |
| PATCH  | `/api/clients/{id}`                   | Atualizar cliente                            |
| DELETE | `/api/clients/{id}`                   | Inativar cliente                             |
| GET    | `/api/orders`                         | Listar pedidos/vendas                        |
| POST   | `/api/orders`                         | Criar venda (deduz estoque automaticamente)  |
| GET    | `/api/orders/{id}`                    | Buscar pedido                                |
| PATCH  | `/api/orders/{id}/cancel`             | Cancelar pedido                              |
| GET    | `/api/dashboard/metrics`             | KPIs: estoque, vendas do dia, inadimplência  |
| GET    | `/api/dashboard/drivers`             | Relatório financeiro por entregador          |

## Regras de Negócio Implementadas

### Inbounds (Entrada de Botijões)
- Registra cabeçalho (placa, NF) + itens por tipo (P13/P20/P45)
- Incrementa `stock_quantity` apenas para itens com `status = "OK"`
- Cria registro em `stock_movements` com `movement_type = "ENTRADA"` para auditoria

### Orders (Vendas)
- Deduz estoque de cada produto vendido automaticamente
- Status automático: `FINALIZADO` (à vista/cartão) ou `ABERTO` (a prazo)
- Cria registro em `stock_movements` com `movement_type = "SAIDA"` para auditoria

### Stock Movements
- `ENTRADA`: quantidade positiva
- `SAIDA`: armazenada como negativa
- `AJUSTE`: aceita positivo ou negativo

## Compatibilidade com Frontend

A API mantém compatibilidade total com o frontend React/Zustand/Axios:
- Base URL: `http://localhost:8080/api` (mesmo endereço do Spring Boot anterior)
- Autenticação: Bearer JWT no header `Authorization`
- Respostas: JSON idêntico ao que o frontend espera (campos como `truckPlate`, `unitPrice`, etc.)
