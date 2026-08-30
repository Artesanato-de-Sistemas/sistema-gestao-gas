# pyrefly: ignore [missing-import]
from django.contrib import admin

# pyrefly: ignore [missing-import]
from django.urls import include, path

from .auth_views import LoginView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/", include("parties.urls")),
    path("api/", include("inventory.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("analytics.urls")),
    path("api/", include("users.urls")),
]
