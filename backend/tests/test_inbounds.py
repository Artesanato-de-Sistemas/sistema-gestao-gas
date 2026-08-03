from unittest.mock import MagicMock, patch, call
import pytest

def test_inbound_payload_valid():
    """InboundCreate should accept valid data."""
    from app.schemas import InboundCreate, InboundItemCreate
    payload = InboundCreate(
        truckPlate="ABC-1234",
        invoice="NF-5678",
        items=[
            InboundItemCreate(category="P13", quantity=10, unit_cost=85.0)
        ],
    )
    assert payload.truckPlate == "ABC-1234"
    assert len(payload.items) == 1
    assert payload.items[0].quantity == 10

def test_inbound_payload_requires_items():
    """InboundCreate should reject empty items list."""
    from pydantic import ValidationError
    from app.schemas import InboundCreate
    with pytest.raises(ValidationError):
        InboundCreate(truckPlate="ABC-1234", invoice="NF-001", items=[])

def test_inbound_item_quantity_gt_zero():
    """InboundItemCreate quantity must be > 0."""
    from pydantic import ValidationError
    from app.schemas import InboundItemCreate
    with pytest.raises(ValidationError):
        InboundItemCreate(category="P13", quantity=0, unit_cost=85.0)

def test_inbound_item_price_non_negative():
    """InboundItemCreate unit_cost must be >= 0."""
    from pydantic import ValidationError
    from app.schemas import InboundItemCreate
    with pytest.raises(ValidationError):
        InboundItemCreate(category="P13", quantity=1, unit_cost=-1.0)

@patch("app.services.inbound_service.get_supabase")
def test_create_inbound_service(mock_get_supabase):
    """InboundService.create_inbound should call Supabase and return InboundResponse."""
    from app.services.inbound_service import InboundService
    from app.schemas import InboundCreate, InboundItemCreate

    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb

    mock_sb.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "inbound-uuid-123", "truck_plate": "XYZ-9999", "invoice_number": "NF-0001",
         "total_amount": 850.0, "status": "FINALIZADO", "created_at": "2024-01-01T10:00:00"}
    ]
    mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
        {"id": "prod-uuid-p13", "stock_quantity": 100}
    ]

    service = InboundService()
    payload = InboundCreate(
        truckPlate="XYZ-9999",
        invoice="NF-0001",
        items=[
            InboundItemCreate(category="P13", quantity=10, unit_cost=85.0)
        ],
    )

    result = service.create_inbound(payload)
    assert result.truck_plate == "XYZ-9999"
    assert result.invoice_number == "NF-0001"
    assert result.total_amount == 850.0

@patch("app.services.inbound_service.get_supabase")
def test_post_inbound_endpoint(mock_get_supabase, client):
    """POST /api/inbounds should return 201 with valid payload."""
    mock_sb = MagicMock()
    mock_get_supabase.return_value = mock_sb

    mock_sb.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "inbound-api-test", "truck_plate": "AAA-0001", "invoice_number": "NF-TEST",
         "total_amount": 500.0, "status": "FINALIZADO", "created_at": "2024-01-15T08:00:00"}
    ]
    mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []

    payload = {
        "truckPlate": "AAA-0001",
        "invoice": "NF-TEST",
        "items": [
            {"category": "P13", "quantity": 5, "unit_cost": 100.0}
        ],
    }
    response = client.post("/api/inbounds", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["truck_plate"] == "AAA-0001"
    assert data["invoice_number"] == "NF-TEST"
