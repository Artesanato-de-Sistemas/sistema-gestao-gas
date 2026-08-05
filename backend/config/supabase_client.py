import os
import json
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


def _sanitize(data: dict) -> dict:
    """
    Converte tipos Python não-serializáveis (UUID, Decimal) para tipos
    compatíveis com o JSON do Supabase SDK.
    """
    result = {}
    for k, v in data.items():
        if isinstance(v, UUID):
            result[k] = str(v)
        elif isinstance(v, Decimal):
            result[k] = float(v)
        elif v is not None:
            result[k] = v
    return result


class SupabaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet que bypassa o ORM Django e faz CRUD direto no Supabase via SDK.
    """
    table_name = None

    def get_queryset(self):
        return self.queryset.none() if self.queryset is not None else []

    def list(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table(self.table_name).select('*').execute()
            return Response(res.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            payload = _sanitize(serializer.validated_data)
            # Remove o id se estiver vazio ou for gerado pelo banco
            payload.pop('id', None)
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
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get('pk')
        try:
            serializer = self.get_serializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            payload = _sanitize(serializer.validated_data)
            payload.pop('id', None)
            res = supabase.table(self.table_name).update(payload).eq('id', pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=404)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def destroy(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get('pk')
        try:
            supabase.table(self.table_name).delete().eq('id', pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
