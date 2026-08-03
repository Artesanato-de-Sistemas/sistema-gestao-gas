from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Returns a singleton Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_key:
            raise RuntimeError(
                "SUPABASE_KEY environment variable is not set. "
                "Please create a .env file based on .env.example."
            )
        _supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    return _supabase_client
