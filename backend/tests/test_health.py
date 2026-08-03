"""Tests for the application health check and basic routing."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """GET / should return 200 with status ok."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Python/FastAPI" in data["version"]


def test_docs_available():
    """OpenAPI docs endpoint should be accessible."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_redoc_available():
    """ReDoc endpoint should be accessible."""
    response = client.get("/redoc")
    assert response.status_code == 200
