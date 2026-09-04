import os
from pathlib import Path

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega variáveis do .env (Supabase, SECRET_KEY, etc.)
load_dotenv(BASE_DIR / ".env")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-chave-temporaria-desenvolvimento")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "rest_framework",
    "corsheaders",
    # Local apps (Seus domínios)
    "inventory",
    "orders",
    "parties",
    "analytics",
    "entries",
    "users",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Deve vir antes do CommonMiddleware
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database Setup
# O Django usa SQLite localmente apenas como stub para que o ORM não quebre.
# Todo acesso real a dados passa pelo Supabase SDK (config/supabase_client.py).
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Configuração alternativa com PostgreSQL, ativada se DATABASE_URL estiver definida
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    try:
        # pyrefly: ignore [missing-import]
        import dj_database_url

        DATABASES["default"] = dj_database_url.parse(DATABASE_URL)
    except ImportError:
        pass  # dj_database_url não instalado, continua com SQLite

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS DEFINITIONS
# Permite sobrescrever via env var para facilitar Preview Deployments do Vercel
_cors_all = os.environ.get("CORS_ALLOW_ALL_ORIGINS", "false").lower() == "true"
CORS_ALLOW_ALL_ORIGINS = _cors_all
CORS_ALLOW_CREDENTIALS = True

_base_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://sistema-gestao-gas.vercel.app",
]
# Origens extras separadas por vírgula (ex: preview deployments do Vercel)
_extra = os.environ.get("CORS_EXTRA_ORIGINS", "")
if _extra:
    _base_origins += [o.strip() for o in _extra.split(",") if o.strip()]

CORS_ALLOWED_ORIGINS = _base_origins

# Padrão para preview deployments do Vercel (*.vercel.app)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://sistema-gestao-gas-.*\.vercel\.app$",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "config.permissions.SupabaseJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [],
}
