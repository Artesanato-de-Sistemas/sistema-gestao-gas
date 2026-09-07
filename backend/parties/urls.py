from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ClienteViewSet, FuncionarioViewSet, ValorClienteViewSet

router = DefaultRouter()
router.register(r"clientes", ClienteViewSet, basename="clientes")
router.register(r"clients", ClienteViewSet, basename="clients")

router.register(r"funcionarios", FuncionarioViewSet, basename="funcionarios")
router.register(r"employees", FuncionarioViewSet, basename="employees")
router.register(r"drivers", FuncionarioViewSet, basename="drivers")
router.register(r"delivery-drivers", FuncionarioViewSet, basename="delivery-drivers")

router.register(r"valor-cliente", ValorClienteViewSet, basename="valor-cliente")

urlpatterns = [
    path("", include(router.urls)),
]
