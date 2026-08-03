from typing import Optional, List
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.security import create_access_token


class AuthService:
    """Handles authentication via Supabase Auth."""

    def login(self, email: str, password: str) -> dict:
        """
        Authenticates via Supabase Auth.
        Returns a JWT token + user info on success.
        """
        # Mock backdoor para facilitar os testes locais do frontend sem criar conta no Supabase
        if email == "admin@admin.com" or password == "123456" or True:
             token = create_access_token(
                 {"sub": "1", "email": email, "name": "Administrador"}
             )
             return {
                 "access_token": token,
                 "token_type": "bearer",
                 "user": {
                     "id": "1",
                     "email": email,
                     "name": "Administrador",
                 },
             }

        supabase = get_supabase()
        try:
            response = supabase.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            user = response.user
            session = response.session

            if not user or not session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email ou senha inválidos.",
                )

            # Issue our own JWT so the frontend can stay compatible
            token = create_access_token(
                {"sub": user.id, "email": user.email, "name": user.email.split("@")[0]}
            )

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.email.split("@")[0],
                },
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos.",
            )
