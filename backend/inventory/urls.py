from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InboundView,
    ProductViewSet,
    StockMovementsListView,
    StockMovementViewSet,
)

router = DefaultRouter()
router.register(r"products", ProductViewSet)
router.register(r"stock-movements", StockMovementViewSet)

urlpatterns = [
    path("", include(router.urls)),
    # Rota do histórico global de movimentações (usada pela tela de Estoque)
    path("stock/movements/", StockMovementsListView.as_view(), name="stock-movements-list"),
    # Rota de entradas (inbounds) usada pela tela de Registro de Entrada
    path("inbounds", InboundView.as_view(), name="inbounds"),
    path("inbounds/", InboundView.as_view(), name="inbounds-slash"),
]
