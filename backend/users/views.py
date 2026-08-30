"""
UserViewSet — CRUD de usuários do sistema.

Dados armazenados na tabela `user_profiles` do Supabase.
Acesso restrito exclusivamente a usuários com role == 'ADMIN'.

Fallback local: quando Supabase não está configurado (dev sem .env),
retorna os usuários de teste em memória.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from config.permissions import IsAdmin
from config.supabase_client import supabase

TABLE = "user_profiles"

# Dados em memória para dev local (quando Supabase não está configurado)
_LOCAL_USERS: list[dict] = [
    {"id": "local-admin-1", "email": "admin@teste.com", "name": "Admin Teste", "role": "ADMIN"},
    {"id": "local-colab-1", "email": "colaborador@teste.com", "name": "Colaborador Teste", "role": "COLABORADOR"},
]


class UserViewSet(ViewSet):
    """CRUD de perfis de usuário. Exclusivo para ADMIN."""

    permission_classes = [IsAdmin]

    # ── List ─────────────────────────────────────────────────────────────────

    def list(self, request):
        if not supabase:
            return Response(_LOCAL_USERS)
        try:
            res = supabase.table(TABLE).select("id, email, name, role, created_at").order("created_at").execute()
            return Response(res.data or [])
        except Exception as e:
            err_str = str(e)
            # Tabela ainda não existe — retorna dados locais em vez de 500
            if "PGRST205" in err_str or "schema cache" in err_str:
                return Response(_LOCAL_USERS)
            return Response({"error": err_str}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Create ────────────────────────────────────────────────────────────────

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        payload = {
            "email": request.data.get("email", "").strip().lower(),
            "name": request.data.get("name", "").strip(),
            "role": request.data.get("role", "COLABORADOR"),
        }
        if not payload["email"] or not payload["name"]:
            return Response({"error": "email e name são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            res = supabase.table(TABLE).insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar usuário."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Retrieve ──────────────────────────────────────────────────────────────

    def retrieve(self, request, pk=None):
        if not supabase:
            match = next((u for u in _LOCAL_USERS if u["id"] == pk), None)
            if not match:
                return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            return Response(match)
        try:
            res = supabase.table(TABLE).select("*").eq("id", pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── Update (PUT / PATCH) ──────────────────────────────────────────────────

    def _update(self, request, pk):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        allowed = {"name", "role"}
        payload = {k: v for k, v in request.data.items() if k in allowed}
        if not payload:
            return Response({"error": "Nenhum campo válido para atualizar."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            res = supabase.table(TABLE).update(payload).eq("id", pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        return self._update(request, pk)

    def partial_update(self, request, pk=None):
        return self._update(request, pk)

    # ── Destroy ───────────────────────────────────────────────────────────────

    def destroy(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        try:
            supabase.table(TABLE).delete().eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
