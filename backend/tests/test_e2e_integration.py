import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer mockup_token_if_needed"}

# Teste 1: Clientes e Endereços
@pytest.mark.asyncio
async def test_client_and_address_flow(async_client, auth_headers):
    login_res = await async_client.post("/api/auth/login", json={"email": "admin@admin.com", "password": "123"})
    if login_res.status_code == 200:
        auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    
    uid = str(uuid.uuid4())[:8]
    client_payload = {
        "name": f"Cliente E2E {uid}",
        "document": f"DOC-{uid}",
        "phone": "32999999999",
        "email": f"e2e-{uid}@teste.com",
        "person_type": "FISICA",
        "trade_name": "",
        "payment_deadline_days": 15,
        "active": True,
        "address": {
            "street": "Rua E2E",
            "number": "123",
            "neighborhood": "Centro",
            "city": "TestCity",
            "state": "TS",
            "zipcode": "12345-678",
            "is_primary": True
        }
    }
    res = await async_client.post("/api/clients", json=client_payload, headers=auth_headers)
    assert res.status_code == 201, f"Failed to create client: {res.text}"
    
    client_data = res.json()
    assert client_data["name"] == f"Cliente E2E {uid}"
    assert "addresses" in client_data
    assert len(client_data["addresses"]) == 1
    
    client_id = client_data["id"]
    
    # GET /clients
    res_get = await async_client.get("/api/clients", headers=auth_headers)
    assert res_get.status_code == 200
    clients = res_get.json()
    assert any(c["id"] == client_id for c in clients)

# Teste 2: Entregadores
@pytest.mark.asyncio
async def test_driver_flow(async_client, auth_headers):
    login_res = await async_client.post("/api/auth/login", json={"email": "admin@admin.com", "password": "123"})
    if login_res.status_code == 200:
        auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
        
    uid = str(uuid.uuid4())[:8]
    driver_payload = {
        "name": f"Driver E2E {uid}",
        "document": f"DRV-{uid}",
        "phone": "3299999999",
        "commission_percentage": 5.0,
        "active": True
    }
    res = await async_client.post("/api/drivers", json=driver_payload, headers=auth_headers)
    assert res.status_code == 201, f"Failed to create driver: {res.text}"
    
    driver_id = res.json()["id"]
    res_get = await async_client.get("/api/drivers", headers=auth_headers)
    assert any(d["id"] == driver_id for d in res_get.json())

# Teste 3: Fluxo de Entrada (Inbounds)
@pytest.mark.asyncio
async def test_inbound_flow(async_client, auth_headers):
    login_res = await async_client.post("/api/auth/login", json={"email": "admin@admin.com", "password": "123"})
    if login_res.status_code == 200:
        auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
        
    uid = str(uuid.uuid4())[:8]
    inbound_payload = {
        "truckPlate": "E2E-1234",
        "invoice": f"NF-E2E-{uid}",
        "items": [
            {"category": "GLP_13KG_CHEIO", "quantity": 10, "unit_cost": 50.0}
        ]
    }
    res = await async_client.post("/api/inbounds", json=inbound_payload, headers=auth_headers)
    assert res.status_code == 201, f"Failed to create inbound: {res.text}"
    
    # We will need the inbound response later so we fetch list
    get_res = await async_client.get("/api/inbounds", headers=auth_headers)
    assert get_res.status_code == 200

# Teste 4: Fluxo de Vendas (Orders)
@pytest.mark.asyncio
async def test_order_flow(async_client, auth_headers):
    login_res = await async_client.post("/api/auth/login", json={"email": "admin@admin.com", "password": "123"})
    if login_res.status_code == 200:
        auth_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
        
    uid = str(uuid.uuid4())[:8]
    c_res = await async_client.post("/api/clients", json={
        "name": "Order Client", "document": f"DOC-O-{uid}", "person_type": "FISICA", "active": True, "payment_deadline_days": 0
    }, headers=auth_headers)
    assert c_res.status_code == 201, c_res.text
    client_id = c_res.json()["id"]
    
    d_res = await async_client.post("/api/drivers", json={
        "name": "Order Driver", "commission_percentage": 10.0, "active": True, "document": f"DRV-O-{uid}"
    }, headers=auth_headers)
    assert d_res.status_code == 201, d_res.text
    driver_id = d_res.json()["id"]
    
    # Create an Inbound to have an inbound_item_id
    inbound_payload = {
        "truckPlate": "O-1234",
        "invoice": f"NF-O-{uid}",
        "items": [
            {"category": "GLP_13KG_CHEIO", "quantity": 10, "unit_cost": 50.0}
        ]
    }
    await async_client.post("/api/inbounds", json=inbound_payload, headers=auth_headers)
    
    # Find the inbound_item_id
    inbounds = await async_client.get("/api/inbounds", headers=auth_headers)
    assert inbounds.status_code == 200
    inbound_list = inbounds.json()
    assert len(inbound_list) > 0
    
    first_inbound = inbound_list[0]
    inbound_item_id = first_inbound["inbound_items"][0]["id"]
    
    order_payload = {
        "client_id": client_id,
        "delivery_driver_id": driver_id,
        "sale_type": "AVISTA",
        "items": [
            {"quantity": 2, "unit_price": 100.0, "product_id": None, "inbound_item_id": inbound_item_id}
        ]
    }
    res = await async_client.post("/api/orders", json=order_payload, headers=auth_headers)
    assert res.status_code == 201, f"Failed to create order: {res.text}"
