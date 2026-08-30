"""
Views de autenticação: login via Supabase ou backdoor local para desenvolvimento.

Backdoor local (sem Supabase):
  admin@teste.com       / 123456  →  role ADMIN
  colaborador@teste.com / 123456  →  role COLABORADOR
  admin@admin.com       / 123456  →  role ADMIN (compatibilidade legada)
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.supabase_client import supabase


# ---------------------------------------------------------------------------
# Backdoor de desenvolvimento local
# ---------------------------------------------------------------------------
_LOCAL_USERS = {
    "admin@admin.com": {
        "token": "fake-jwt-token-for-admin",
        "user": {"id": "local-admin-0", "email": "admin@admin.com", "name": "Administrador", "role": "ADMIN"},
    },
    "admin@teste.com": {
        "token": "fake-jwt-token-for-admin-teste",
        "user": {"id": "local-admin-1", "email": "admin@teste.com", "name": "Admin Teste", "role": "ADMIN"},
    },
    "colaborador@teste.com": {
        "token": "fake-jwt-token-for-colaborador-teste",
        "user": {"id": "local-colab-1", "email": "colaborador@teste.com", "name": "Colaborador Teste", "role": "COLABORADOR"},  # noqa: E501
    },
}
_LOCAL_PASSWORD = "123456"  # noqa: S105


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"error": "Email e senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Backdoor local ──────────────────────────────────────────────────
        if email in _LOCAL_USERS and password == _LOCAL_PASSWORD:
            entry = _LOCAL_USERS[email]
            return Response(
                {
                    "access_token": entry["token"],
                    "token_type": "bearer",
                    "user": entry["user"],
                }
            )

        # ── Supabase Auth ───────────────────────────────────────────────────
        if not supabase:
            return Response(
                {"error": "Supabase não configurado."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})

            if not response.session:
                return Response(
                    {"detail": "Falha ao iniciar sessão."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = response.user or response.session.user
            if not user:
                return Response(
                    {"detail": "Usuário não retornado."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user_email: str = getattr(user, "email", "") or ""
            user_meta: dict = getattr(user, "user_metadata", {}) or {}
            app_meta: dict = getattr(user, "app_metadata", {}) or {}
            role: str = (
                user_meta.get("role")
                or app_meta.get("role")
                or "COLABORADOR"
            )

            return Response(
                {
                    "access_token": response.session.access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": str(getattr(user, "id", "")),
                        "email": user_email,
                        "name": user_meta.get("name", user_email.split("@")[0]),
                        "role": role,
                    },
                }
            )

        except Exception as e:
            print(f"[LoginView] Erro: {e}", flush=True)
            return Response(
                {"detail": "Email ou senha inválidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
