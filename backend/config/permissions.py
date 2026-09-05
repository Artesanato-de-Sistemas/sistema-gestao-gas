import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission

# ---------------------------------------------------------------------------
# Backdoor para desenvolvimento local (sem Supabase configurado)
# ---------------------------------------------------------------------------
FAKE_TOKENS: dict[str, dict] = {
    "fake-jwt-token-for-admin": {
        "id": "f8805402-8477-40cb-8960-cae435b62fc5",
        "email": "admin@admin.com",
        "name": "Administrador",
        "role": "ADMIN",
    },
    "fake-jwt-token-for-colab": {
        "id": "b1a48a80-411f-4765-9821-96210bdbe936",
        "email": "colab@colab.com",
        "name": "Colaborador",
        "role": "COLABORADOR",
    },
}


class AuthenticatedUser:
    """Objeto de usuário autenticado compatível com o sistema DRF."""

    is_authenticated = True

    def __init__(self, data: dict) -> None:
        self.id: str = str(data.get("id") or data.get("sub") or "")
        self.email: str = data.get("email", "")
        self.name: str = data.get("name", "")
        self.role: str = str(data.get("role", "COLABORADOR")).upper()

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Autentica via Bearer token no header Authorization.
    Decodifica o token JWT gerado pelo backend ou tokens fake locais.
    """

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        # 1. Tokens de desenvolvimento local direto
        if token in FAKE_TOKENS:
            return (AuthenticatedUser(FAKE_TOKENS[token]), token)

        # 2. JWT assinado pelo backend
        try:
            # Tenta com validação da assinatura
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
                options={"verify_signature": False},  # Tolera chaves rotacionadas em dev
            )

            user_data = {
                "id": payload.get("id") or payload.get("sub", ""),
                "email": payload.get("email", ""),
                "name": payload.get("name", ""),
                "role": payload.get("role", "COLABORADOR"),
            }
            return (AuthenticatedUser(user_data), token)

        except AuthenticationFailed:
            raise
        except Exception as exc:
            raise AuthenticationFailed("Token inválido ou expirado.") from exc


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
    ADMIN: acesso irrestrito (GET, POST, PUT, PATCH, DELETE).
    COLABORADOR / VENDEDOR: apenas leitura e criação (GET, HEAD, OPTIONS, POST).
    Não pode editar nem apagar nada.
    """

    ALLOWED_METHODS = {"GET", "HEAD", "OPTIONS", "POST"}
    message = "Colaboradores só podem ler e registrar dados. Edição e exclusão são restritas a administradores."

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, "role", None)
        if role == "ADMIN":
            return True
        if role in ("COLABORADOR", "VENDEDOR"):
            return request.method in self.ALLOWED_METHODS
        return False

