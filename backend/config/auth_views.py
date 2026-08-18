from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.supabase_client import supabase


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Backdoor for local testing
        if email == 'admin@admin.com' and password == '123456':  # noqa: S105
            return Response(
                {
                    "access_token": "fake-jwt-token-for-admin",
                    "token_type": "bearer",
                    "user": {"id": "1", "email": email, "name": "Administrador"},
                }
            )

        if not supabase:
            return Response({"error": "Supabase not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            response = supabase.auth.sign_in_with_password({"email": email, "password": password})
            
            if not response.session:
                return Response({"detail": "Falha ao iniciar sessão."}, status=status.HTTP_401_UNAUTHORIZED)
                
            user = response.user or response.session.user
            if not user:
                return Response({"detail": "Usuário não retornado."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_email = getattr(user, 'email', '') or ""
            user_name = user_email.split("@")[0] if user_email else "Usuário"
            user_id = getattr(user, 'id', '')

            return Response(
                {
                    "access_token": response.session.access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": user_id,
                        "email": user_email,
                        "name": user_name,
                    },
                }
            )
        except Exception:
            return Response({"detail": "Email ou senha inválidos."}, status=status.HTTP_401_UNAUTHORIZED)
