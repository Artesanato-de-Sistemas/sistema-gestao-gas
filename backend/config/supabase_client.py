import os
from decimal import Decimal
from uuid import UUID
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def _sanitize(data) -> dict:
    """
    Converte tipos Python não-serializáveis (UUID, Decimal) para tipos
    compatíveis com o JSON do Supabase SDK.
    Aceita tanto dict (de serializer.validated_data) quanto dict normal (de request.data).
    """
    if isinstance(data, dict):
        result = {}
        for k, v in data.items():
            if isinstance(v, UUID):
                result[k] = str(v)
            elif isinstance(v, Decimal):
                result[k] = float(v)
            elif v is not None:
                result[k] = v
        return result
    return data


class SupabaseViewSet(viewsets.ViewSet):
    """
    ViewSet genérico que bypassa o ORM Django e faz CRUD direto no Supabase via SDK.

    Usa request.data diretamente (sem validação de serializer) para evitar problemas
    com FKs do modelo Django que apontam para o banco Postgres (Supabase) mas o ORM
    está usando SQLite (apenas como stub para migrações).
    """
    table_name = None
    # Subclasses podem declarar serializer_class e queryset para compatibilidade,
    # mas eles não serão usados na lógica de leitura/escrita.
    serializer_class = None
    queryset = None

    # Campos que nunca devem ser enviados ao Supabase (gerados pelo banco ou FK aninhada)
    READONLY_FIELDS = {'id', 'created_at', 'updated_at'}

    def _clean_payload(self, data: dict) -> dict:
        """Remove campos somente-leitura e sanitiza tipos."""
        cleaned = {k: v for k, v in data.items() if k not in self.READONLY_FIELDS}
        return _sanitize(cleaned)

    def list(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table(self.table_name).select('*').execute()
            return Response(res.data or [])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            payload = self._clean_payload(dict(request.data))
            res = supabase.table(self.table_name).insert(payload).execute()
            if not res.data:
                return Response({"error": "Falha ao criar registro."}, status=500)
            return Response(res.data[0], status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def retrieve(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get('pk')
        try:
            res = supabase.table(self.table_name).select('*').eq('id', pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=404)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def update(self, request, *args, **kwargs):
        """PUT — atualização completa."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get('pk')
        try:
            payload = self._clean_payload(dict(request.data))
            res = supabase.table(self.table_name).update(payload).eq('id', pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=404)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def partial_update(self, request, *args, **kwargs):
        """PATCH — atualização parcial."""
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get('pk')
        try:
            supabase.table(self.table_name).delete().eq('id', pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
