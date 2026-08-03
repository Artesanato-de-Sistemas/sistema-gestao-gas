from fastapi import APIRouter, Depends, Query
from app.schemas import DashboardMetrics
from app.services.dashboard_service import DashboardService
from app.core.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
_service = DashboardService()


@router.get("/metrics", response_model=DashboardMetrics, summary="Métricas do dashboard")
def get_metrics(_: dict = Depends(get_current_user)):
    """Retorna KPIs consolidados: estoque, vendas do dia, inadimplência."""
    return _service.get_metrics()


@router.get("/drivers", summary="Relatório financeiro dos entregadores")
def get_driver_reports(
    period: str = Query("Hoje", description="Hoje | Semana | Mês"),
    _: dict = Depends(get_current_user),
):
    return _service.get_driver_reports(period=period)
