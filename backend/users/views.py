import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from config.permissions import IsAdmin
from config.supabase_client import supabase

logger = logging.getLogger(__name__)
TABLE = "funcionarios"


class UserViewSet(ViewSet):
    """CRUD de usuários do sistema. Exclusivo para ADMIN."""
    permission_classes = [IsAdmin]

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
            for u in users:
                u["name"] = u.get("nome")
            return Response(users)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        data = request.data
        email = (data.get("email") or "").strip().lower()
        nome = (data.get("nome") or data.get("name") or "").strip()
        senha = str(data.get("senha") or "123456")

        if not email or not nome:
            return Response({"error": "email e nome são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "email": email,
            "nome": nome,
            "senha": senha,
            "role": (data.get("role") or "COLABORADOR").upper(),
            "cpf": data.get("cpf") or None,
            "telefone": data.get("telefone") or None,
            "ativo": data.get("ativo", True),
        }
        try:
            res = supabase.table(TABLE).insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar usuário."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            created = res.data[0]
            created["name"] = created.get("nome")
            created.pop("senha", None)
            return Response(created, status=status.HTTP_201_CREATED)
        except Exception as e:
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
            u = res.data[0]
            u["name"] = u.get("nome")
            return Response(u)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        allowed = {"nome", "role", "cpf", "telefone", "ativo", "senha"}
        payload = {}
        for k, v in request.data.items():
            if k in allowed:
                payload[k] = v
            elif k == "name":
                payload["nome"] = v

        if not payload:
            return Response({"error": "Nenhum campo válido para atualizar."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            res = supabase.table(TABLE).update(payload).eq("id", pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            updated = res.data[0]
            updated["name"] = updated.get("nome")
            updated.pop("senha", None)
            return Response(updated)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)

    def destroy(self, request, pk=None):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=status.HTTP_501_NOT_IMPLEMENTED)
        try:
            supabase.table(TABLE).update({"ativo": False}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
