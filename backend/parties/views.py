from rest_framework import viewsets
from config.supabase_client import SupabaseViewSet
from .models import Client, Employee, DeliveryDriver
from .serializers import ClientSerializer, EmployeeSerializer, DeliveryDriverSerializer

class ClientViewSet(SupabaseViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    table_name = 'clients'

class EmployeeViewSet(SupabaseViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    table_name = 'employees'

class DeliveryDriverViewSet(SupabaseViewSet):
    queryset = DeliveryDriver.objects.all()
    serializer_class = DeliveryDriverSerializer
    table_name = 'delivery_drivers'
