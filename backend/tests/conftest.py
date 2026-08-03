"""
Shared pytest fixtures using TestClient from FastAPI.
Uses dependency injection to mock Supabase so tests run without real credentials.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core import security


# ── Auth bypass ──────────────────────────────────────────────────────────────

def override_get_current_user():
    return {"sub": "test-user-id", "email": "test@imperiodogas.com.br", "name": "Test Admin"}


app.dependency_overrides[security.get_current_user] = override_get_current_user


@pytest.fixture
def client():
    """Returns a synchronous TestClient with auth bypassed."""
    with TestClient(app) as tc:
        yield tc


@pytest.fixture
def mock_supabase():
    """Provides a MagicMock for the Supabase client."""
    with patch("app.core.database.get_supabase") as mock:
        yield mock
