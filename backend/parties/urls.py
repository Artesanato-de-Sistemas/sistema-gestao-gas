from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, EmployeeViewSet, DeliveryDriverViewSet, DriversDashboardView, DashboardMetricsView

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'delivery-drivers', DeliveryDriverViewSet)
# Alias /drivers -> DeliveryDriverViewSet (compatibilidade com frontend)
router.register(r'drivers', DeliveryDriverViewSet, basename='drivers')

urlpatterns = [
    path('', include(router.urls)),
    # Dashboard financeiro de entregadores
    path('dashboard/drivers', DriversDashboardView.as_view(), name='drivers-dashboard'),
    path('dashboard/drivers/', DriversDashboardView.as_view(), name='drivers-dashboard-slash'),
    # Dashboard de métricas gerais
    path('dashboard/metrics', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('dashboard/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics-slash'),
]
