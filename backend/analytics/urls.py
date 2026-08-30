from django.urls import path
from . import views

urlpatterns = [
    path('sales-by-driver-monthly/', views.sales_by_driver_monthly, name='sales_by_driver_monthly'),
]