from datetime import date, timedelta
from typing import List

from app.core.database import get_supabase
from app.schemas import DashboardMetrics, DriverFinancialReport


class DashboardService:
    """Aggregates metrics for the main dashboard."""

    def get_metrics(self) -> DashboardMetrics:
        supabase = get_supabase()
        today = date.today().isoformat()

        # Stock levels
        products_resp = supabase.table("products").select("name, stock_quantity").eq("active", True).execute()
        stock_p13, stock_p20, stock_p45 = 0, 0, 0
        for p in products_resp.data or []:
            name = p.get("name", "").upper()
            if "P13" in name:
                stock_p13 += p.get("stock_quantity", 0)
            elif "P20" in name:
                stock_p20 += p.get("stock_quantity", 0)
            elif "P45" in name:
                stock_p45 += p.get("stock_quantity", 0)

        # Sales today
        orders_resp = (
            supabase.table("orders")
            .select("total_amount, status")
            .gte("created_at", f"{today}T00:00:00")
            .lte("created_at", f"{today}T23:59:59")
            .execute()
        )
        orders_today = orders_resp.data or []
        sales_today = sum(o["total_amount"] for o in orders_today if o["status"] != "CANCELADO")
        orders_count = len([o for o in orders_today if o["status"] != "CANCELADO"])

        # Overdue invoices (ABERTO orders past due_date)
        overdue_resp = (
            supabase.table("orders")
            .select("id")
            .eq("status", "ABERTO")
            .lt("due_date", today)
            .execute()
        )
        overdue_count = len(overdue_resp.data or [])

        return DashboardMetrics(
            stock_p13=stock_p13,
            stock_p20=stock_p20,
            stock_p45=stock_p45,
            sales_today=sales_today,
            orders_today=orders_count,
            overdue_invoices=overdue_count,
        )

    def get_driver_reports(self, period: str = "Hoje") -> List[DriverFinancialReport]:
        """Aggregates per-driver financial data for the given period."""
        supabase = get_supabase()
        today = date.today()

        if period == "Hoje":
            start = today.isoformat()
        elif period == "Semana":
            start = (today - timedelta(days=7)).isoformat()
        else:  # Mês
            start = (today - timedelta(days=30)).isoformat()

        orders_resp = (
            supabase.table("orders")
            .select("delivery_driver_id, total_amount, employees(name)")
            .neq("status", "CANCELADO")
            .gte("created_at", f"{start}T00:00:00")
            .execute()
        )

        driver_map: dict = {}
        for order in orders_resp.data or []:
            driver_id = order.get("delivery_driver_id")
            if not driver_id:
                continue
            employee = order.get("employees") or {}
            driver_name = employee.get("name", "Desconhecido")
            if driver_id not in driver_map:
                driver_map[driver_id] = {
                    "driverId": driver_id,
                    "driverName": driver_name,
                    "cylindersSold": 0,
                    "grossAmount": 0.0,
                    "withdrawals": 0.0,
                    "netProfit": 0.0,
                }
            driver_map[driver_id]["grossAmount"] += order["total_amount"]
            driver_map[driver_id]["netProfit"] += order["total_amount"]

        # Fetch withdrawals (sangrias) — assuming a 'withdrawals' table
        try:
            withdrawals_resp = (
                supabase.table("withdrawals")
                .select("employee_id, amount")
                .gte("created_at", f"{start}T00:00:00")
                .execute()
            )
            for w in withdrawals_resp.data or []:
                eid = w.get("employee_id")
                if eid in driver_map:
                    driver_map[eid]["withdrawals"] += w["amount"]
                    driver_map[eid]["netProfit"] -= w["amount"]
        except Exception:
            pass  # withdrawals table may not exist yet

        return [DriverFinancialReport(**v) for v in driver_map.values()]
