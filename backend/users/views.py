import logging
import re

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from config.permissions import IsAdmin
from config.supabase_client import supabase

logger = logging.getLogger(__name__)
TABLE = "funcionarios"

VALID_ROLES = {"ADMIN", "COLABORADOR", "VENDEDOR"}


def _format_user(u: dict) -> dict:
    raw_email = u.get("email") or ""
    display_login = raw_email.split("@")[0] if "@" in raw_email else raw_email
    return {
        "id": str(u.get("id")),
        "nome": u.get("nome") or display_login,
        "name": u.get("nome") or display_login,
        "email": raw_email,
        "login": display_login,
        "username": display_login,
        "role": (u.get("role") or "COLABORADOR").upper(),
        "cpf": u.get("cpf"),
        "telefone": u.get("telefone"),
        "ativo": u.get("ativo", True),
        "created_at": u.get("created_at"),
    }


class UserViewSet(ViewSet):
    """
    CRUD de usuários do sistema para ADMIN e endpoint /me para o usuário autenticado.
    """

    def get_permissions(self):
        if self.action == "me":
            return [IsAuthenticated()]
        return [IsAdmin()]

    @action(detail=False, methods=["get", "patch", "put"])
    def me(self, request):
        """Visualiza e atualiza os dados do próprio usuário autenticado."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)

        user_id = getattr(request.user, "id", None)
        if not user_id:
            return Response({"error": "Usuário não identificado."}, status=status.HTTP_401_UNAUTHORIZED)

        if request.method == "GET":
            try:
                res = (
                    supabase.table(TABLE)
                    .select("id, email, nome, role, cpf, telefone, ativo, created_at")
                    .eq("id", user_id)
                    .execute()
                )
                if not res.data:
                    return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
                return Response(_format_user(res.data[0]))
            except Exception as e:
                logger.error(f"[UserViewSet.me GET] Erro: {e}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # PATCH / PUT
        data = request.data
        payload = {}

        # 1. Atualização do Nome
        nome = (data.get("nome") or data.get("name") or "").strip()
        if nome:
            payload["nome"] = nome

        # 2. Atualização do Login / Usuário
        raw_login = (
            data.get("username")
            or data.get("login")
            or data.get("email")
            or ""
        ).strip().lower()

        if raw_login:
            # Validação alfanumérica simples (letras, números, ponto, underscore, traço)
            if not re.match(r"^[a-zA-Z0-9_.-]{3,50}$", raw_login):
                return Response(
                    {"error": "O nome de usuário deve conter entre 3 e 50 caracteres alfanuméricos (letras, números, '.', '_', '-')."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verifica se já existe outro usuário com o mesmo login
            try:
                check = (
                    supabase.table(TABLE)
                    .select("id")
                    .ilike("email", raw_login)
                    .neq("id", user_id)
                    .eq("ativo", True)
                    .execute()
                )
                if check.data and len(check.data) > 0:
                    return Response(
                        {"error": "Este nome de usuário já está em uso por outra conta."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception as e:
                logger.error(f"[UserViewSet.me check login] Erro: {e}")

            payload["email"] = raw_login

        # 3. Atualização de Senha
        senha = data.get("senha") or data.get("password") or data.get("nova_senha")
        if senha is not None:
            senha_str = str(senha).strip()
            if len(senha_str) < 4:
                return Response(
                    {"error": "A senha deve conter no mínimo 4 caracteres."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payload["senha"] = senha_str

        # 4. Outros campos opcionais
        if "telefone" in data:
            payload["telefone"] = data.get("telefone") or None
        if "cpf" in data:
            payload["cpf"] = data.get("cpf") or None

        if not payload:
            return Response({"error": "Nenhum dado válido para atualizar."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            res = supabase.table(TABLE).update(payload).eq("id", user_id).execute()
            if not res.data:
                return Response({"error": "Falha ao atualizar perfil."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(_format_user(res.data[0]))
        except Exception as e:
            logger.error(f"[UserViewSet.me UPDATE] Erro: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request):
        if not supabase:
            return Response([])
        try:
            res = (
                supabase.table(TABLE)
                .select("id, email, nome, role, cpf, telefone, ativo, created_at")
                .order("created_at")
                .execute()
            )
            users = res.data or []
            return Response([_format_user(u) for u in users])
        except Exception as e:
            logger.error(f"[UserViewSet list] Erro: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        data = request.data
        login = (
            data.get("username")
            or data.get("login")
            or data.get("email")
            or ""
        ).strip().lower()
        nome = (data.get("nome") or data.get("name") or "").strip()
        senha = str(data.get("senha") or data.get("password") or "").strip()
        role = str(data.get("role") or "COLABORADOR").upper()

        if not login or not nome:
            return Response({"error": "Nome e usuário/login são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        if not senha:
            return Response({"error": "A senha é obrigatória na criação do usuário."}, status=status.HTTP_400_BAD_REQUEST)

        if len(senha) < 4:
            return Response({"error": "A senha deve ter pelo menos 4 caracteres."}, status=status.HTTP_400_BAD_REQUEST)

        if not re.match(r"^[a-zA-Z0-9_.-]{3,50}$", login):
            return Response(
                {"error": "O nome de usuário deve conter entre 3 e 50 caracteres alfanuméricos (letras, números, '.', '_', '-')."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role not in VALID_ROLES:
            role = "COLABORADOR"

        # Checa duplicidade de login
        try:
            check = supabase.table(TABLE).select("id").ilike("email", login).eq("ativo", True).execute()
            if check.data and len(check.data) > 0:
                return Response(
                    {"error": "Já existe um usuário cadastrado com este login."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            logger.error(f"[UserViewSet create check] Erro: {e}")

        payload = {
            "email": login,
            "nome": nome,
            "senha": senha,
            "role": role,
            "cpf": data.get("cpf") or None,
            "telefone": data.get("telefone") or None,
            "ativo": data.get("ativo", True),
        }
        try:
            res = supabase.table(TABLE).insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar usuário."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(_format_user(res.data[0]), status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"[UserViewSet create] Erro: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, pk=None):
        if not supabase:
            return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        try:
            res = (
                supabase.table(TABLE)
                .select("id, email, nome, role, cpf, telefone, ativo, created_at")
                .eq("id", pk)
                .execute()
            )
            if not res.data:
                return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            return Response(_format_user(res.data[0]))
        except Exception as e:
            logger.error(f"[UserViewSet retrieve] Erro: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        data = request.data
        payload = {}

        if "nome" in data or "name" in data:
            payload["nome"] = (data.get("nome") or data.get("name") or "").strip()

        login = (
            data.get("username")
            or data.get("login")
            or data.get("email")
            or ""
        ).strip().lower()
        if login:
            if not re.match(r"^[a-zA-Z0-9_.-]{3,50}$", login):
                return Response(
                    {"error": "O nome de usuário deve conter entre 3 e 50 caracteres alfanuméricos."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                check = supabase.table(TABLE).select("id").ilike("email", login).neq("id", pk).eq("ativo", True).execute()
                if check.data and len(check.data) > 0:
                    return Response({"error": "Este login já está em uso."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"[UserViewSet partial_update check] Erro: {e}")
            payload["email"] = login

        if "role" in data:
            r = str(data["role"]).upper()
            if r in VALID_ROLES:
                payload["role"] = r

        if "senha" in data or "password" in data:
            s = str(data.get("senha") or data.get("password") or "").strip()
            if s:
                if len(s) < 4:
                    return Response({"error": "A senha deve conter no mínimo 4 caracteres."}, status=status.HTTP_400_BAD_REQUEST)
                payload["senha"] = s

        if "cpf" in data:
            payload["cpf"] = data.get("cpf") or None
        if "telefone" in data:
            payload["telefone"] = data.get("telefone") or None
        if "ativo" in data:
            payload["ativo"] = bool(data["ativo"])

        if not payload:
            return Response({"error": "Nenhum campo válido para atualizar."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            res = supabase.table(TABLE).update(payload).eq("id", pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            return Response(_format_user(res.data[0]))
        except Exception as e:
            logger.error(f"[UserViewSet partial_update] Erro: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)

    def destroy(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        
        # Impede o admin de deletar o próprio usuário
        current_id = getattr(request.user, "id", None)
        if current_id and str(current_id) == str(pk):
            return Response(
                {"error": "Você não pode desativar ou excluir sua própria conta logada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            supabase.table(TABLE).update({"ativo": False}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"[UserViewSet destroy] Erro: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
