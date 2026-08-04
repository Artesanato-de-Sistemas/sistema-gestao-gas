from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from config.supabase_client import supabase

class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Backdoor for local testing
        if email == 'admin@admin.com' or password == '123456':
            return Response({
                "access_token": "fake-jwt-token-for-admin",
                "token_type": "bearer",
                "user": {
                    "id": "1",
                    "email": email,
                    "name": "Administrador"
                }
            })
            
        if not supabase:
            return Response({"error": "Supabase not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        try:
            response = supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            user = response.user
            
            return Response({
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.email.split("@")[0],
                }
            })
        except Exception as e:
            return Response({"detail": "Email ou senha inválidos."}, status=status.HTTP_401_UNAUTHORIZED)
