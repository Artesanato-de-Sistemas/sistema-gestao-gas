from fastapi import APIRouter, Depends
from app.schemas import LoginRequest, TokenResponse
from app.services.auth_service import AuthService
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])
_service = AuthService()


@router.post("/login", response_model=TokenResponse, summary="Login com email e senha")
def login(data: LoginRequest):
    """
    Autentica o usuário via Supabase Auth.
    Retorna um JWT token compatível com o frontend React/Zustand.
    """
    return _service.login(data.email, data.password)


@router.get("/me", summary="Retorna o usuário autenticado")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
