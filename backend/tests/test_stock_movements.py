"""
Tests for Stock Movements (CRUD + business logic).
"""
from unittest.mock import MagicMock, patch
import pytest


# ─── Schema tests ─────────────────────────────────────────────────────────────

def test_stock_movement_create_valid():
    from app.schemas import StockMovementCreate
    m = StockMovementCreate(product_id="p1", movement_type="ENTRADA", quantity=10)
    assert m.movement_type == "ENTRADA"
    assert m.quantity == 10


def test_stock_movement_invalid_type():
    from pydantic import ValidationError
    from app.schemas import StockMovementCreate
    with pytest.raises(ValidationError):
        StockMovementCreate(product_id="p1", movement_type="INVALIDO", quantity=5)


# ─── Service unit tests ───────────────────────────────────────────────────────

@patch("app.services.product_service.get_supabase")
def test_create_movement_entrada(mock_get_supabase):
    """ENTRADA movement should store positive quantity."""
    from app.services.product_service import ProductService
    from app.schemas import StockMovementCreate

    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb

    mock_sb.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "mov-1", "product_id": "prod-1", "movement_type": "ENTRADA",
         "quantity": 20, "notes": None, "created_at": "2024-01-01T08:00:00"}
    ]
    # Mock RPC call
    mock_sb.rpc.return_value.execute.return_value = None

    service = ProductService()
    data = StockMovementCreate(product_id="prod-1", movement_type="ENTRADA", quantity=20)
    result = service.create_movement(data)

    assert result.product_id == "prod-1"
    assert result.movement_type == "ENTRADA"


@patch("app.services.product_service.get_supabase")
def test_create_movement_saida_negative(mock_get_supabase):
    """SAIDA movement should store negative quantity."""
    from app.services.product_service import ProductService
    from app.schemas import StockMovementCreate

    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb

    mock_sb.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "mov-2", "product_id": "prod-1", "movement_type": "SAIDA",
         "quantity": -5, "notes": "Venda", "created_at": "2024-01-01T09:00:00"}
    ]
    mock_sb.rpc.return_value.execute.return_value = None

    service = ProductService()
    data = StockMovementCreate(product_id="prod-1", movement_type="SAIDA", quantity=5)
    result = service.create_movement(data)
    # quantity stored should be negative for SAIDA
    assert result.quantity == -5


# ─── API endpoint tests ───────────────────────────────────────────────────────

@patch("app.services.product_service.get_supabase")
def test_get_all_movements(mock_get_supabase, client):
    """GET /api/stock/movements should return a list."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb

    mock_sb.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value.data = [
        {"id": "m1", "product_id": "p1", "movement_type": "ENTRADA",
         "quantity": 50, "notes": "NF 1234", "created_at": "2024-01-10T08:00:00"}
    ]

    response = client.get("/api/stock/movements")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["movement_type"] == "ENTRADA"


@patch("app.services.product_service.get_supabase")
def test_create_movement_via_api(mock_get_supabase, client):
    """POST /api/products/{id}/movements should return 201."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb

    mock_sb.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "new-mov", "product_id": "prod-abc", "movement_type": "AJUSTE",
         "quantity": 3, "notes": "Ajuste manual", "created_at": "2024-01-11T10:00:00"}
    ]
    mock_sb.rpc.return_value.execute.return_value = None

    payload = {"product_id": "prod-abc", "movement_type": "AJUSTE", "quantity": 3, "notes": "Ajuste manual"}
    response = client.post("/api/products/prod-abc/movements", json=payload)
    assert response.status_code == 201
