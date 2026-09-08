import logging
import os
import threading
import time
from decimal import Decimal
from typing import Any
from uuid import UUID

import httpx
from rest_framework import status, viewsets
from rest_framework.response import Response
from supabase import ClientOptions, create_client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

_local = threading.local()


def _make_client():
    """
    Cria uma instância isolada do Supabase Client por thread com HTTP/1.1 e retry
    automático no transporte HTTP. Isso evita colisões de socket e erros WSAEWOULDBLOCK
    ([WinError 10035] e [WinError 10054]) comuns no Windows ao lidar com requisições concorrentes.
    """
    if not (SUPABASE_URL and SUPABASE_KEY):
        return None
    transport = httpx.HTTPTransport(retries=3)
    http_client = httpx.Client(
        http2=False,
        timeout=httpx.Timeout(30.0, connect=10.0),
        transport=transport,
    )
    options = ClientOptions(httpx_client=http_client)
    return create_client(SUPABASE_URL, SUPABASE_KEY, options=options)


def get_supabase_client():
    if not (SUPABASE_URL and SUPABASE_KEY):
        return None
    if not hasattr(_local, "client") or _local.client is None:
        _local.client = _make_client()
    return _local.client


class _TableProxy:
    """
    Proxy transparente para consultas PostgREST com retry resiliente
    contra erros de socket temporários no Windows.
    """

    def __init__(self, builder):
        self._builder = builder

    def __getattr__(self, name):
        attr = getattr(self._builder, name)
        if callable(attr):

            def wrapper(*args, **kwargs):
                if name == "execute":
                    max_attempts = 3
                    for attempt in range(max_attempts):
                        try:
                            return attr(*args, **kwargs)
                        except (OSError, httpx.RequestError) as e:
                            if attempt == max_attempts - 1:
                                logger.error(f"[Supabase] Falha definitiva após {max_attempts} tentativas: {e}")
                                raise
                            time.sleep(0.15 * (attempt + 1))
                res = attr(*args, **kwargs)
                if hasattr(res, "execute"):
                    return _TableProxy(res)
                return res

            return wrapper
        return attr


class _SupabaseProxy:
    """
    Proxy global thread-safe para o cliente Supabase.
    Permite import direto ('from config.supabase_client import supabase')
    garantindo que cada thread utilize seu próprio socket pool isolado.
    """

    def table(self, name: str):
        client = get_supabase_client()
        if client is None:
            raise RuntimeError("Supabase client não configurado.")
        return _TableProxy(client.table(name))

    def __getattr__(self, name: str):
        client = get_supabase_client()
        if client is None:
            raise RuntimeError("Supabase client não configurado.")
        return getattr(client, name)

    def __bool__(self) -> bool:
        return bool(SUPABASE_URL and SUPABASE_KEY)


supabase = _SupabaseProxy()


def _sanitize(data) -> dict:
    """
    Converte tipos Python não-serializáveis (UUID, Decimal) para tipos
    compatíveis com o JSON do Supabase SDK.
    Aceita tanto dict (de serializer.validated_data) quanto dict normal (de request.data).
    """
    if isinstance(data, dict):
        result: dict[str, Any] = {}
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

    table_name: str = ""
    serializer_class = None
    queryset = None

    READONLY_FIELDS = {"id", "created_at", "updated_at"}

    def _clean_payload(self, data: dict) -> dict:
        """Remove campos somente-leitura e sanitiza tipos."""
        cleaned = {k: v for k, v in data.items() if k not in self.READONLY_FIELDS}
        return _sanitize(cleaned)

    def list(self, request, *args, **kwargs):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        try:
            res = supabase.table(self.table_name).select("*").execute()
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
        pk = kwargs.get("pk")
        try:
            res = supabase.table(self.table_name).select("*").eq("id", pk).execute()
            if not res.data:
                return Response({"error": "Não encontrado."}, status=404)
            return Response(res.data[0])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def update(self, request, *args, **kwargs):
        """PUT — atualização completa."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get("pk")
        try:
            payload = self._clean_payload(dict(request.data))
            res = supabase.table(self.table_name).update(payload).eq("id", pk).execute()
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
        pk = kwargs.get("pk")
        try:
            supabase.table(self.table_name).delete().eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
