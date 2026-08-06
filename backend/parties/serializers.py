from rest_framework import serializers
from .models import Client, Employee, DeliveryDriver

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class DeliveryDriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryDriver
        fields = '__all__'
