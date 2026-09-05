from django.urls import path

from .views import (
    DashboardMetricsView,
    PesquisaAvancadaView,
    PesquisaEntregadoresView,
    PesquisaEstoqueView,
    PesquisaFinanceiroView,
)

urlpatterns = [
    # Dashboard
    path("dashboard/", DashboardMetricsView.as_view(), name="dashboard-metrics"),
    path("dashboard", DashboardMetricsView.as_view(), name="dashboard-slashless"),
    path("dashboard/metrics/", DashboardMetricsView.as_view(), name="dashboard-metrics-slash"),
    path("dashboard/metrics", DashboardMetricsView.as_view(), name="dashboard-metrics-noslash"),
    path("dashboard/drivers", PesquisaEntregadoresView.as_view(), name="dashboard-drivers"),
    path("dashboard/drivers/", PesquisaEntregadoresView.as_view(), name="dashboard-drivers-slash"),
    # Pesquisa - 4 sub-abas
    path("pesquisa/estoque/", PesquisaEstoqueView.as_view(), name="pesquisa-estoque"),
    path("pesquisa/estoque", PesquisaEstoqueView.as_view(), name="pesquisa-estoque-noslash"),
    path("pesquisa/financeiro/", PesquisaFinanceiroView.as_view(), name="pesquisa-financeiro"),
    path("pesquisa/financeiro", PesquisaFinanceiroView.as_view(), name="pesquisa-financeiro-noslash"),
    path("pesquisa/entregadores/", PesquisaEntregadoresView.as_view(), name="pesquisa-entregadores"),
    path("pesquisa/entregadores", PesquisaEntregadoresView.as_view(), name="pesquisa-entregadores-noslash"),
    path("pesquisa/avancada/", PesquisaAvancadaView.as_view(), name="pesquisa-avancada"),
    path("pesquisa/avancada", PesquisaAvancadaView.as_view(), name="pesquisa-avancada-noslash"),
    # Alias legado
    path("sales-by-driver-monthly/", PesquisaEntregadoresView.as_view(), name="sales-by-driver-monthly"),
]
