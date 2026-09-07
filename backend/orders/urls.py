from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import VendaViewSet

router = DefaultRouter()
router.register(r"vendas", VendaViewSet, basename="vendas")
router.register(r"orders", VendaViewSet, basename="orders")

urlpatterns = [
    path("", include(router.urls)),
]
