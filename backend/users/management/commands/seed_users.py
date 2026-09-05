"""
Management command: seed_users

Garante que os usuários de teste do RBAC MVP existam no Supabase.
Executa no startup automático ou manualmente:

    python manage.py seed_users

Usuários criados (se não existirem):
  - admin@teste.com       / 123456  →  role ADMIN
  - colaborador@teste.com / 123456  →  role COLABORADOR

O perfil na tabela `user_profiles` também é criado.
"""

from django.core.management.base import BaseCommand

from config.supabase_client import supabase

SEED_USERS = [
    {
        "email": "admin@teste.com",
        "password": "123456",
        "profile": {"email": "admin@teste.com", "name": "Admin Teste", "role": "ADMIN"},
    },
    {
        "email": "colaborador@teste.com",
        "password": "123456",
        "profile": {"email": "colaborador@teste.com", "name": "Colaborador Teste", "role": "COLABORADOR"},
    },
]


class Command(BaseCommand):
    help = "Cria os usuários de teste para RBAC caso não existam."

    def handle(self, *args, **options):
        if not supabase:
            self.stdout.write(self.style.WARNING(
                "Supabase não configurado. Seed ignorado — use o backdoor local para testes."
            ))
            return

        for entry in SEED_USERS:
            email = entry["email"]
            self.stdout.write(f"Verificando {email}...")

            # 1) Tenta criar na Auth do Supabase (falha silenciosamente se já existe)
            try:
                supabase.auth.admin.create_user({
                    "email": email,
                    "password": entry["password"],
                    "email_confirm": True,
                    "user_metadata": {
                        "name": entry["profile"]["name"],
                        "role": entry["profile"]["role"],
                    },
                })
                self.stdout.write(f"  ✔ Usuário Auth criado: {email}")
            except Exception as e:
                msg = str(e)
                if "already been registered" in msg or "already exists" in msg:
                    self.stdout.write(f"  ⊙ Auth já existe: {email}")
                else:
                    self.stdout.write(self.style.WARNING(f"  ⚠ Auth erro: {e}"))

            # 2) Garante o perfil na tabela user_profiles (upsert por email)
            try:
                existing = supabase.table("user_profiles").select("id").eq("email", email).execute()
                if existing.data:
                    self.stdout.write(f"  ⊙ Profile já existe: {email}")
                else:
                    supabase.table("user_profiles").insert(entry["profile"]).execute()
                    self.stdout.write(f"  ✔ Profile criado: {email}")
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  ⚠ Profile erro (tabela existe?): {e}"))

        self.stdout.write(self.style.SUCCESS("Seed de usuários concluído."))
