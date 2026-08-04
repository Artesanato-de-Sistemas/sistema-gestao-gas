import os
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class SupabaseViewSet(viewsets.ModelViewSet):
    """
    A custom ViewSet that bypasses the Django ORM and interacts directly with Supabase via its Python SDK.
    """
    table_name = None

    def get_queryset(self):
        # We return an empty queryset to satisfy DRF's internal checks
        return self.queryset.none() if self.queryset is not None else []

    def list(self, request, *args, **kwargs):
        if not supabase:
            return super().list(request, *args, **kwargs)
        res = supabase.table(self.table_name).select('*').execute()
        return Response(res.data)
        
    def create(self, request, *args, **kwargs):
        if not supabase:
            return super().create(request, *args, **kwargs)
        # Use DRF serializer to validate input
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Insert into supabase
        res = supabase.table(self.table_name).insert(serializer.validated_data).execute()
        if not res.data:
            return Response({"error": "Failed to create"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(res.data[0], status=status.HTTP_201_CREATED)
        
    def retrieve(self, request, *args, **kwargs):
        if not supabase:
            return super().retrieve(request, *args, **kwargs)
        pk = kwargs.get('pk')
        res = supabase.table(self.table_name).select('*').eq('id', pk).execute()
        if not res.data:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(res.data[0])
        
    def update(self, request, *args, **kwargs):
        if not supabase:
            return super().update(request, *args, **kwargs)
        pk = kwargs.get('pk')
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        res = supabase.table(self.table_name).update(serializer.validated_data).eq('id', pk).execute()
        if not res.data:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(res.data[0])
        
    def destroy(self, request, *args, **kwargs):
        if not supabase:
            return super().destroy(request, *args, **kwargs)
        pk = kwargs.get('pk')
        supabase.table(self.table_name).delete().eq('id', pk).execute()
        return Response(status=status.HTTP_204_NO_CONTENT)
