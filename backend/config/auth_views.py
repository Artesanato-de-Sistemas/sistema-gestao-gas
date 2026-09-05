from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.supabase_client import supabase

# ---------------------------------------------------------------------------
# Backdoor de desenvolvimento local (caso Supabase offline)
# ---------------------------------------------------------------------------
_LOCAL_USERS = {
    "admin@admin.com": {
        "id": "f8805402-8477-40cb-8960-cae435b62fc5",
        "email": "admin@admin.com",
        "name": "Administrador",
        "role": "ADMIN",
        "senha": "123456",
    },
    "colab@colab.com": {
        "id": "b1a48a80-411f-4765-9821-96210bdbe936",
        "email": "colab@colab.com",
        "name": "Colaborador",
        "role": "COLABORADOR",
        "senha": "123456",
    },
}


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = str(request.data.get("password", ""))

        if not email or not password:
            return Response(
                {"error": "Email e senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_data = None

        # 1. Tenta autenticar na tabela public.funcionarios do Supabase
        if supabase:
            try:
                res = (
                    supabase.table("funcionarios")
                    .select("*")
                    .eq("email", email)
                    .eq("ativo", True)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    func = res.data[0]
                    # Compara senha cadastrada (suporta texto plano ou hash futuro)
                    if str(func.get("senha")) == password:
                        user_data = {
                            "id": str(func["id"]),
                            "email": func["email"],
                            "name": func.get("nome") or email.split("@")[0],
                            "role": func.get("role", "COLABORADOR").upper(),
                        }
            except Exception as e:
                print(f"[LoginView] Erro ao consultar funcionarios no Supabase: {e}", flush=True)

        # 2. Fallback para _LOCAL_USERS se Supabase falhou ou offline
        if not user_data and email in _LOCAL_USERS:
            local = _LOCAL_USERS[email]
            if local["senha"] == password:
                user_data = {
                    "id": local["id"],
                    "email": local["email"],
                    "name": local["name"],
                    "role": local["role"],
                }

        if not user_data:
            return Response(
                {"detail": "Email ou senha inválidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # 3. Gera JWT assinado
        exp = datetime.now(timezone.utc) + timedelta(days=7)
        token_payload = {
            "sub": user_data["id"],
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "role": user_data["role"],
            "exp": exp,
        }
        token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm="HS256")

        return Response(
            {
                "access_token": token,
                "token_type": "bearer",
                "user": user_data,
            }
        )

