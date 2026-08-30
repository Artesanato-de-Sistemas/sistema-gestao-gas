"""
Autenticação e permissões customizadas para RBAC MVP.

Estratégia:
- SupabaseJWTAuthentication lê o Bearer token do header Authorization.
  - Tokens "fake-jwt-*": resolvidos do dicionário FAKE_TOKENS (dev local).
  - JWTs Supabase reais: decodificados (sem verificação de assinatura, MVP)
    para extrair user_metadata.role.
- IsAdmin: aceita apenas usuários com role == 'ADMIN'.
- IsColaborador: aceita ADMIN ou COLABORADOR com métodos GET/POST/HEAD/OPTIONS.
"""

import base64
import json

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission

# ---------------------------------------------------------------------------
# Backdoor para desenvolvimento local (sem Supabase configurado)
# ---------------------------------------------------------------------------
FAKE_TOKENS: dict[str, dict] = {
    "fake-jwt-token-for-admin": {
        "id": "local-admin-0",
        "email": "admin@admin.com",
        "name": "Administrador",
        "role": "ADMIN",
    },
    "fake-jwt-token-for-admin-teste": {
        "id": "local-admin-1",
        "email": "admin@teste.com",
        "name": "Admin Teste",
        "role": "ADMIN",
    },
    "fake-jwt-token-for-colaborador-teste": {
        "id": "local-colab-1",
        "email": "colaborador@teste.com",
        "name": "Colaborador Teste",
        "role": "COLABORADOR",
    },
}


class FakeUser:
    """Objeto de usuário mínimo compatível com o sistema de permissões do DRF."""

    is_authenticated = True

    def __init__(self, data: dict) -> None:
        self.id: str = data.get("id", "")
        self.email: str = data.get("email", "")
        self.name: str = data.get("name", "")
        self.role: str = data.get("role", "COLABORADOR")

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"


# ---------------------------------------------------------------------------
# Autenticação
# ---------------------------------------------------------------------------

class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Autentica via Bearer token no header Authorization.

    Precedência:
    1. Tokens fake (dev local) → resolvidos imediatamente via FAKE_TOKENS.
    2. JWT real do Supabase → payload decodificado; role extraído de
       user_metadata.role ou app_metadata.role (fallback: COLABORADOR).
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        # Tokens de desenvolvimento local
        if token in FAKE_TOKENS:
            return (FakeUser(FAKE_TOKENS[token]), token)

        # JWT Supabase
        try:
            parts = token.split(".")
            if len(parts) != 3:
                raise AuthenticationFailed("Token JWT malformado.")
            # Decodifica o payload (base64url, sem verificar assinatura — MVP)
            payload_b64 = parts[1] + "=="  # padding
            payload_bytes = base64.urlsafe_b64decode(payload_b64)
            payload: dict = json.loads(payload_bytes)

            user_meta: dict = payload.get("user_metadata") or {}
            app_meta: dict = payload.get("app_metadata") or {}
            role: str = (
                user_meta.get("role")
                or app_meta.get("role")
                or "COLABORADOR"
            )

            email: str = payload.get("email", "")
            user_data = {
                "id": payload.get("sub", ""),
                "email": email,
                "name": user_meta.get("name", email.split("@")[0]),
                "role": role,
            }
            return (FakeUser(user_data), token)

        except AuthenticationFailed:
            raise
        except Exception as exc:
            raise AuthenticationFailed("Token inválido ou expirado.") from exc


# ---------------------------------------------------------------------------
# Permissões
# ---------------------------------------------------------------------------

class IsAdmin(BasePermission):
    """Permite acesso total apenas a usuários com role == 'ADMIN'."""

    message = "Acesso restrito a administradores."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "ADMIN"
        )


class IsColaborador(BasePermission):
    """
    ADMIN: acesso irrestrito.
    COLABORADOR: apenas GET, HEAD, OPTIONS e POST.
    """

    ALLOWED_METHODS = {"GET", "HEAD", "OPTIONS", "POST"}
    message = "Colaboradores só podem ler e criar registros."

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, "role", None)
        if role == "ADMIN":
            return True
        if role == "COLABORADOR":
            return request.method in self.ALLOWED_METHODS
        return False
