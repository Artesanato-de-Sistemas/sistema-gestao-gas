"""Tests for Products API (CRUD operations)."""
from unittest.mock import MagicMock, patch
import pytest


MOCK_PRODUCT = {
    "id": "prod-001",
    "name": "Botijão P13 (Cheio)",
    "current_price": 115.0,
    "active": True,
    "stock_quantity": 245,
    "updated_at": "2024-01-01T00:00:00",
}


@patch("app.services.product_service.get_supabase")
def test_list_products(mock_get_supabase, client):
    """GET /api/products should return a list of products."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb
    mock_sb.table.return_value.select.return_value.order.return_value.execute.return_value.data = [MOCK_PRODUCT]

    response = client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["name"] == "Botijão P13 (Cheio)"
    assert data[0]["stock_quantity"] == 245


@patch("app.services.product_service.get_supabase")
def test_get_single_product(mock_get_supabase, client):
    """GET /api/products/{id} should return the product."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb
    mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = MOCK_PRODUCT

    response = client.get("/api/products/prod-001")
    assert response.status_code == 200
    assert response.json()["id"] == "prod-001"


@patch("app.services.product_service.get_supabase")
def test_get_product_not_found(mock_get_supabase, client):
    """GET /api/products/{id} for missing product should return 404."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb
    mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None

    response = client.get("/api/products/nonexistent")
    assert response.status_code == 404


@patch("app.services.product_service.get_supabase")
def test_create_product(mock_get_supabase, client):
    """POST /api/products should create and return a product."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb
    mock_sb.table.return_value.insert.return_value.execute.return_value.data = [MOCK_PRODUCT]

    payload = {"name": "Botijão P13 (Cheio)", "current_price": 115.0, "active": True, "stock_quantity": 0}
    response = client.post("/api/products", json=payload)
    assert response.status_code == 201
    assert response.json()["name"] == "Botijão P13 (Cheio)"
