from datetime import datetime, timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.supabase_client import SupabaseViewSet, supabase

from .models import Client, DeliveryDriver, Employee
from .serializers import ClientSerializer, DeliveryDriverSerializer, EmployeeSerializer


class ClientViewSet(SupabaseViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    table_name = "clients"

    def destroy(self, request, *args, **kwargs):
        """Soft delete — inativa ao invés de excluir fisicamente."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get("pk")
        try:
            supabase.table("clients").update({"active": False}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class EmployeeViewSet(SupabaseViewSet):
    """
    ViewSet de funcionários.
    Usa a tabela 'users' do Supabase, que contém os dados de funcionários
    (role: ADMINISTRADOR, SECRETARIO, ENTREGADOR, etc.).
    A tabela 'employees' foi planejada mas ainda não criada; 'users' serve o mesmo propósito.
    """

    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    table_name = "users"  # Tabela real no Supabase (employees não existe ainda)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — inativa ao invés de excluir fisicamente."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get("pk")
        try:
            supabase.table("users").update({"active": False}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class DeliveryDriverViewSet(SupabaseViewSet):
    queryset = DeliveryDriver.objects.all()
    serializer_class = DeliveryDriverSerializer
    table_name = "delivery_drivers"

    def destroy(self, request, *args, **kwargs):
        """Soft delete — inativa ao invés de excluir fisicamente."""
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)
        pk = kwargs.get("pk")
        try:
            supabase.table("delivery_drivers").update({"active": False}).eq("id", pk).execute()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class DriversDashboardView(APIView):
    """
    GET /api/dashboard/drivers?period=Hoje|Semana|Mês
    Retorna relatório financeiro por entregador.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        period = request.query_params.get("period", "Hoje")

        try:
            from datetime import datetime, timedelta, timezone

            now = datetime.now(timezone.utc)
            if period == "Hoje":
                since = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == "Semana":
                since = now - timedelta(days=7)
            else:  # Mês ou Mes (sem acento — compatibilidade com clientes que não encodam URL)
                since = now - timedelta(days=30)

            since_str = since.isoformat()

            # Busca entregadores ativos
            drivers_res = supabase.table("delivery_drivers").select("id, name").eq("active", True).execute()
            drivers = drivers_res.data or []

            # Busca ordens no período
            orders_res = (
                supabase.table("orders")
                .select("id, delivery_driver_id, total_amount, status")
                .gte("created_at", since_str)
                .execute()
            )
            orders = orders_res.data or []

            report = []
            for driver in drivers:
                driver_id = driver["id"]
                driver_orders = [o for o in orders if o.get("delivery_driver_id") == driver_id]
                gross_amount = sum(
                    float(o.get("total_amount") or 0) for o in driver_orders if o.get("status") != "CANCELADO"
                )
                cylinders_sold = len(driver_orders)
                # Sangria: pode ser expandida futuramente com tabela de saques
                withdrawals = 0.0
                net_profit = gross_amount - withdrawals

                report.append(
                    {
                        "driverId": driver_id,
                        "driverName": driver["name"],
                        "cylindersSold": cylinders_sold,
                        "grossAmount": gross_amount,
                        "withdrawals": withdrawals,
                        "netProfit": net_profit,
                    }
                )

            return Response(report)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class DashboardMetricsView(APIView):
    """
    GET /api/dashboard/metrics — métricas gerais do sistema para a tela de Dashboard.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        if not supabase:
            return Response({"error": "Supabase não configurado."}, status=500)

        try:
            now = datetime.now(timezone.utc)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

            # Estoque por categoria (calculado via inbound_items.available_quantity)
            items_res = supabase.table("inbound_items").select("category, available_quantity").execute()
            items = items_res.data or []

            stock_p13 = sum(
                (i.get("available_quantity", 0) or 0) for i in items if "GLP_13KG_CHEIO" in (i.get("category") or "")
            )
            stock_p20 = sum(
                (i.get("available_quantity", 0) or 0) for i in items if "GLP_20KG_CHEIO" in (i.get("category") or "")
            )
            stock_p45 = sum(
                (i.get("available_quantity", 0) or 0) for i in items if "GLP_45KG_CHEIO" in (i.get("category") or "")
            )

            # Vendas de hoje
            orders_res = (
                supabase.table("orders").select("total_amount, status").gte("created_at", today_start).execute()
            )
            orders_today = orders_res.data or []
            finished_orders = [o for o in orders_today if o.get("status") == "ENTREGUE"]
            sales_today = sum(float(o.get("total_amount") or 0) for o in finished_orders)

            return Response(
                {
                    "stock_p13": stock_p13,
                    "stock_p20": stock_p20,
                    "stock_p45": stock_p45,
                    "sales_today": sales_today,
                    "orders_today": len(finished_orders),
                    "overdue_invoices": 0,  # Expandível futuramente
                }
            )

        except Exception as e:
            return Response({"error": str(e)}, status=500)
