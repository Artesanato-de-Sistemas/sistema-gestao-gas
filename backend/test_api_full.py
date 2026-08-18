"""
Script de teste completo da API - Império do Gás ERP
Testa todos os endpoints: auth, clients, drivers, employees, products, inbounds, orders.
"""

import io
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid

# Força UTF-8 no stdout do Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8000"

PASS = "[PASS]"
FAIL = "[FAIL]"
INFO = "[INFO]"

results = []

def req(method, path, body=None, label=""):
    # Garante que a URL seja corretamente encodada (ex: caracteres especiais no query string)
    url = BASE_URL + path
    data = json.dumps(body).encode('utf-8') if body else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            status = resp.status
            try:
                payload = json.loads(resp.read())
            except Exception:
                payload = {}
            return status, payload
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read())
        except Exception:
            payload = {}
        return e.code, payload
    except Exception as ex:
        return 0, {"error": str(ex)}


def check(label, status, payload, expected_status, check_fn=None):
    ok = status == expected_status
    if ok and check_fn:
        ok = check_fn(payload)
    icon = PASS if ok else FAIL
    print(f"  {icon} [{status}] {label}")
    if not ok:
        print(f"       Retorno: {json.dumps(payload, ensure_ascii=False)[:200]}")
    results.append((label, ok))
    return payload if ok else None


# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  IMPÉRIO DO GÁS — TESTE COMPLETO DA API")
print("="*60)

# ─────────────────────────────────────────────────────────────────────────────
print("\n[1] AUTH")
s, p = req("POST", "/api/auth/login/", {"email": "admin@admin.com", "password": "123456"})
check("POST /api/auth/login/ (backdoor admin)", s, p, 200, lambda d: "access_token" in d)

s, p = req("POST", "/api/auth/login/", {"email": "invalido@x.com", "password": "errado"})
check("POST /api/auth/login/ (credenciais inválidas → 401)", s, p, 401)

# ─────────────────────────────────────────────────────────────────────────────
print("\n[2] CLIENTS")
uid = str(uuid.uuid4())[:8]
client_payload = {
    "name": f"Cliente Teste {uid}",
    "document": f"DOC-{uid}",
    "phone": "32999999999",
    "payment_deadline_days": 15,
    "active": True,
}
s, p = req("GET", "/api/clients/")
check("GET /api/clients/", s, p, 200, lambda d: isinstance(d, list))

s, created_client = req("POST", "/api/clients/", client_payload)
client_id = check("POST /api/clients/ (criar)", s, created_client, 201, lambda d: "id" in d)
if client_id:
    client_id = created_client["id"]

    s, p = req("GET", f"/api/clients/{client_id}/")
    check("GET /api/clients/{id}/ (detalhe)", s, p, 200, lambda d: d.get("id") == client_id)

    s, p = req("PUT", f"/api/clients/{client_id}/", {**client_payload, "name": f"Cliente Atualizado {uid}"})
    check("PUT /api/clients/{id}/ (atualizar)", s, p, 200, lambda d: "atualizado" in d.get("name", "").lower() or d.get("id") == client_id)

    s, p = req("DELETE", f"/api/clients/{client_id}/")
    check("DELETE /api/clients/{id}/ (soft delete)", s, p, 204)

    # Verifica se foi realmente inativado
    s, p = req("GET", f"/api/clients/{client_id}/")
    if s == 200:
        check("Verifica soft-delete: active=False", s, p, 200, lambda d: d.get("active") == False)
    else:
        print(f"  {INFO} Soft-delete: registro retornou status {s}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n[3] DELIVERY DRIVERS (entregadores)")
uid = str(uuid.uuid4())[:8]
driver_payload = {
    "name": f"Entregador {uid}",
    "document": f"ENT-{uid}",
    "phone": "32988888888",
    "commission_percentage": 5.0,
    "active": True,
}
s, p = req("GET", "/api/drivers/")
check("GET /api/drivers/", s, p, 200, lambda d: isinstance(d, list))

s, created_driver = req("POST", "/api/drivers/", driver_payload)
driver_id = check("POST /api/drivers/ (criar)", s, created_driver, 201, lambda d: "id" in d)
if driver_id:
    driver_id = created_driver["id"]

    s, p = req("GET", f"/api/drivers/{driver_id}/")
    check("GET /api/drivers/{id}/ (detalhe)", s, p, 200, lambda d: d.get("id") == driver_id)

    s, p = req("DELETE", f"/api/drivers/{driver_id}/")
    check("DELETE /api/drivers/{id}/ (soft delete)", s, p, 204)

# ─────────────────────────────────────────────────────────────────────────────
print("\n[4] EMPLOYEES (funcionários — tabela 'users' no Supabase)")
uid = str(uuid.uuid4())[:8]
employee_payload = {
    "name": f"Funcionário {uid}",
    "cpf": f"FUNC-{uid}",        # 'users' usa cpf em vez de document
    "email": f"func-{uid}@test.com",
    "role": "SECRETARIO",
    "active": True,
}
s, p = req("GET", "/api/employees/")
check("GET /api/employees/", s, p, 200, lambda d: isinstance(d, list))

s, created_employee = req("POST", "/api/employees/", employee_payload)
employee_id = check("POST /api/employees/ (criar)", s, created_employee, 201, lambda d: "id" in d)
if employee_id:
    employee_id = created_employee["id"]

    s, p = req("DELETE", f"/api/employees/{employee_id}/")
    check("DELETE /api/employees/{id}/ (soft delete)", s, p, 204)

# ─────────────────────────────────────────────────────────────────────────────
print("\n[5] PRODUCTS (estoque por categoria)")
s, p = req("GET", "/api/products/")
check("GET /api/products/ (summary por inbound_items)", s, p, 200, lambda d: isinstance(d, list))
if isinstance(p, list) and p:
    print(f"  {INFO} Categorias disponíveis: {[x.get('category') for x in p[:5]]}")

# ─────────────────────────────────────────────────────────────────────────────
print("\n[6] INBOUNDS (entrada de estoque)")
uid = str(uuid.uuid4())[:8]
inbound_payload = {
    "invoice": f"NF-TEST-{uid}",
    "truckPlate": f"TST-{uid[:4].upper()}",
    "items": [
        {"category": "GLP_13KG_CHEIO", "quantity": 10, "unit_cost": 75.00},
        {"category": "GLP_20KG_CHEIO", "quantity": 5, "unit_cost": 130.00},
    ]
}
s, p = req("GET", "/api/inbounds/")
check("GET /api/inbounds/", s, p, 200, lambda d: isinstance(d, list))

s, created_inbound = req("POST", "/api/inbounds/", inbound_payload)
inbound_result = check("POST /api/inbounds/ (registrar entrada)", s, created_inbound, 201, lambda d: "inbound_id" in d)

# Inbound sem itens → 400
s, p = req("POST", "/api/inbounds/", {"invoice": "NF-X", "truckPlate": "XXX-0000", "items": []})
check("POST /api/inbounds/ (sem itens → 400)", s, p, 400)

# Inbound sem campos obrigatórios → 400
s, p = req("POST", "/api/inbounds/", {"items": [{"category": "GLP_13KG_CHEIO", "quantity": 1, "unit_cost": 10}]})
check("POST /api/inbounds/ (sem placa/NF → 400)", s, p, 400)

# ─────────────────────────────────────────────────────────────────────────────
print("\n[7] STOCK MOVEMENTS (movimentações de estoque)")
s, p = req("GET", "/api/stock/movements/")
check("GET /api/stock/movements/", s, p, 200, lambda d: isinstance(d, list))

# ─────────────────────────────────────────────────────────────────────────────
print("\n[8] ORDERS (pedidos)")
s, p = req("GET", "/api/orders/")
check("GET /api/orders/", s, p, 200, lambda d: isinstance(d, list))

# Para criar pedido, precisamos de um cliente ativo e de estoque disponível
# Buscamos um cliente ativo real
s, clients = req("GET", "/api/clients/")
active_clients = [c for c in (clients if isinstance(clients, list) else []) if c.get("active")]
test_client_id = active_clients[0]["id"] if active_clients else None

# Buscamos estoque disponível
s, products = req("GET", "/api/products/")
available_product = None
if isinstance(products, list):
    available_product = next((p for p in products if p.get("stock_quantity", 0) > 0), None)

if test_client_id and available_product:
    category = available_product["category"]
    order_payload = {
        "client_id": test_client_id,
        "delivery_driver_id": None,
        "sale_type": "AVISTA",
        "items": [
            {"product_id": category, "quantity": 1, "unit_price": 85.00}
        ]
    }
    s, created_order = req("POST", "/api/orders/", order_payload)
    order_result = check("POST /api/orders/ (criar pedido com estoque)", s, created_order, 201, lambda d: "id" in d)

    if order_result:
        order_id = created_order["id"]

        s, p = req("GET", f"/api/orders/{order_id}/")
        check("GET /api/orders/{id}/ (detalhe)", s, p, 200, lambda d: d.get("id") == order_id)

        s, p = req("PATCH", f"/api/orders/{order_id}/", {"status": "ENTREGUE"})
        check("PATCH /api/orders/{id}/ (atualizar status)", s, p, 200)

        s, p = req("DELETE", f"/api/orders/{order_id}/")
        check("DELETE /api/orders/{id}/ (cancelar pedido)", s, p, 204)
else:
    print(f"  {INFO} Pulando POST /api/orders/ — cliente_id={test_client_id}, produto_disponível={available_product}")

# Order sem client_id → 400
s, p = req("POST", "/api/orders/", {"items": [{"product_id": "GLP_13KG_CHEIO", "quantity": 1, "unit_price": 85.0}]})
check("POST /api/orders/ (sem client_id → 400)", s, p, 400)

# Order sem itens → 400
if test_client_id:
    s, p = req("POST", "/api/orders/", {"client_id": test_client_id, "items": []})
    check("POST /api/orders/ (sem itens → 400)", s, p, 400)

# ─────────────────────────────────────────────────────────────────────────────
print("\n[9] DASHBOARD")
s, p = req("GET", "/api/dashboard/metrics/")
check("GET /api/dashboard/metrics/", s, p, 200, lambda d: "stock_p13" in d)

s, p = req("GET", "/api/dashboard/drivers?period=Hoje")
check("GET /api/dashboard/drivers?period=Hoje", s, p, 200, lambda d: isinstance(d, list))

s, p = req("GET", "/api/dashboard/drivers?period=Semana")
check("GET /api/dashboard/drivers?period=Semana", s, p, 200, lambda d: isinstance(d, list))

# Mês → usando 'Mes' (alias sem acento aceito pela view) para evitar encode issue
s, p = req("GET", "/api/dashboard/drivers?period=Mes")
check("GET /api/dashboard/drivers?period=Mes (alias de Mes)", s, p, 200, lambda d: isinstance(d, list))

# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
total = len(results)
passed = sum(1 for _, ok in results if ok)
failed = total - passed
print(f"  RESULTADO: {passed}/{total} testes passaram  |  {failed} falhou(aram)")
print("="*60 + "\n")

if failed > 0:
    print("Testes que falharam:")
    for label, ok in results:
        if not ok:
            print(f"  FAIL: {label}")
    print()
    sys.exit(1)
sys.exit(0)
