from rest_framework import viewsets
from .models import Client, Employee, DeliveryDriver
from .serializers import ClientSerializer, EmployeeSerializer, DeliveryDriverSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class DeliveryDriverViewSet(viewsets.ModelViewSet):
    queryset = DeliveryDriver.objects.all()
    serializer_class = DeliveryDriverSerializer
