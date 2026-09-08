import logging
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import serializers, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView

from config.supabase_client import supabase

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Backdoor de desenvolvimento local (caso Supabase offline)
# ---------------------------------------------------------------------------
_LOCAL_USERS = {
    "admin": {
        "id": "f8805402-8477-40cb-8960-cae435b62fc5",
        "email": "admin",
        "name": "Administrador",
        "role": "ADMIN",
        "senha": "123456",
    },
    "admin@admin.com": {
        "id": "f8805402-8477-40cb-8960-cae435b62fc5",
        "email": "admin@admin.com",
        "name": "Administrador",
        "role": "ADMIN",
        "senha": "123456",
    },
    "colab": {
        "id": "b1a48a80-411f-4765-9821-96210bdbe936",
        "email": "colab",
        "name": "Colaborador",
        "role": "COLABORADOR",
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


class LoginSerializer(serializers.Serializer):
    """
    Validador de entrada para login.
    Suporta tanto 'email' quanto 'username'/'login' e tanto 'password' quanto 'senha'.
    """

    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    login = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True)
    senha = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        identifier = (attrs.get("email") or attrs.get("username") or attrs.get("login") or "").strip()
        pwd = str(attrs.get("password") or attrs.get("senha") or "").strip()

        errors = {}
        if not identifier and not pwd:
            errors["detail"] = "Os campos de e-mail/usuário e senha são obrigatórios."
            errors["email"] = ["O campo de e-mail ou usuário é obrigatório."]
            errors["password"] = ["O campo senha é obrigatório."]
        elif not identifier:
            errors["detail"] = "O campo de e-mail ou usuário é obrigatório."
            errors["email"] = ["O campo de e-mail ou usuário é obrigatório."]
        elif not pwd:
            errors["detail"] = "O campo senha é obrigatório."
            errors["password"] = ["O campo senha é obrigatório."]

        if errors:
            raise serializers.ValidationError(errors)

        attrs["email"] = identifier
        attrs["password"] = pwd
        return attrs


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = LoginSerializer

    def get_authenticate_header(self, request):
        return "Bearer"

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user_data = None

        # 1. Consulta no Supabase na tabela 'funcionarios'
        if supabase:
            try:
                # Consulta direta conforme especificação:
                res = (
                    supabase.table("funcionarios")
                    .select("*")
                    .eq("email", email)
                    .eq("senha", password)
                    .eq("ativo", True)
                    .execute()
                )

                # Se não encontrar pelo email exato, tenta ilike (case-insensitive)
                if not res.data:
                    res = (
                        supabase.table("funcionarios")
                        .select("*")
                        .ilike("email", email)
                        .eq("senha", password)
                        .eq("ativo", True)
                        .execute()
                    )

                # Se ainda não encontrar e não contém '@', tenta por prefixo (ex: admin -> admin@admin.com)
                if (not res.data) and ("@" not in email):
                    res = (
                        supabase.table("funcionarios")
                        .select("*")
                        .ilike("email", f"{email}@%")
                        .eq("senha", password)
                        .eq("ativo", True)
                        .execute()
                    )

                if res.data and len(res.data) > 0:
                    func = res.data[0]
                    raw_email = func.get("email") or ""
                    display_login = raw_email.split("@")[0] if "@" in raw_email else raw_email
                    user_data = {
                        "id": str(func.get("id") or ""),
                        "username": display_login,
                        "login": display_login,
                        "email": raw_email,
                        "name": func.get("nome") or display_login,
                        "role": str(func.get("role") or "COLABORADOR").upper(),
                    }
            except Exception as e:
                logger.error(f"[LoginView] Erro ao consultar funcionarios no Supabase: {e}")

        # 2. Fallback para _LOCAL_USERS se Supabase falhou ou offline
        if not user_data and email.lower() in _LOCAL_USERS:
            local = _LOCAL_USERS[email.lower()]
            local_email = local.get("email", "")
            if local.get("senha") == password:
                display_login = local_email.split("@")[0] if "@" in local_email else local_email
                user_data = {
                    "id": str(local.get("id") or ""),
                    "username": display_login,
                    "login": display_login,
                    "email": local.get("email", ""),
                    "name": local.get("name") or display_login,
                    "role": str(local.get("role") or "COLABORADOR").upper(),
                }

        # 3. Tratamento de erro 401 Unauthorized se não encontrar o usuário
        if not user_data:
            raise AuthenticationFailed("Credenciais inválidas. Verifique o usuário e a senha.")

        # 4. Gera JWT assinado
        exp = datetime.now(timezone.utc) + timedelta(days=7)
        token_payload = {
            "sub": user_data["id"],
            "id": user_data["id"],
            "username": user_data["username"],
            "login": user_data["login"],
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
