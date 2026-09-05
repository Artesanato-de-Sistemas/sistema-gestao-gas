from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EntradaViewSet, ProdutoViewSet, SaidaViewSet

router = DefaultRouter()
router.register(r"produtos", ProdutoViewSet, basename="produtos")
router.register(r"products", ProdutoViewSet, basename="products")

router.register(r"entradas", EntradaViewSet, basename="entradas")
router.register(r"inbounds", EntradaViewSet, basename="inbounds")

router.register(r"saidas", SaidaViewSet, basename="saidas")

urlpatterns = [
    path("", include(router.urls)),
]
