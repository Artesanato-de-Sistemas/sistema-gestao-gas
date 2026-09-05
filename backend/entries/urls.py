from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PagamentoViewSet, PlanilhaView, SangriaViewSet

router = DefaultRouter()
router.register(r"pagamentos", PagamentoViewSet, basename="pagamentos")
router.register(r"payments", PagamentoViewSet, basename="payments")

router.register(r"sangrias", SangriaViewSet, basename="sangrias")

urlpatterns = [
    path("", include(router.urls)),
    path("planilha/", PlanilhaView.as_view(), name="planilha"),
    path("planilha", PlanilhaView.as_view(), name="planilha-slashless"),
    path("orders/worksheet/", PlanilhaView.as_view(), name="orders-worksheet"),
    path("orders/worksheet", PlanilhaView.as_view(), name="orders-worksheet-slashless"),
    path("entries/save/", PlanilhaView.as_view(), name="entries-save"),
    path("entries/save", PlanilhaView.as_view(), name="entries-save-slashless"),
]
