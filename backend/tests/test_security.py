"""Tests for security utilities (JWT)."""
import pytest
from datetime import timedelta
from app.core.security import create_access_token, decode_token
from fastapi import HTTPException


def test_create_and_decode_token():
    """Token created should be decodable and contain the original payload."""
    data = {"sub": "user-123", "email": "admin@test.com"}
    token = create_access_token(data)
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["email"] == "admin@test.com"


def test_expired_token_raises():
    """Expired token should raise HTTPException 401."""
    data = {"sub": "user-expired"}
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))
    with pytest.raises(HTTPException) as exc_info:
        decode_token(token)
    assert exc_info.value.status_code == 401


def test_invalid_token_raises():
    """Garbage token should raise HTTPException 401."""
    with pytest.raises(HTTPException) as exc_info:
        decode_token("not.a.valid.token")
    assert exc_info.value.status_code == 401
