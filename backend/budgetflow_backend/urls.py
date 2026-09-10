from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    db_ok = True
    db_details = {}
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_details["database"] = "connected"
        from django.contrib.auth import get_user_model
        User = get_user_model()
        db_details["user_count"] = User.objects.count()
        db_details["admin_exists"] = User.objects.filter(is_superuser=True).exists()
    except Exception as e:
        db_ok = False
        db_details["database"] = "error"
        db_details["database_error"] = str(e)

    return JsonResponse({
        "status": "healthy" if db_ok else "database_not_ready",
        "service": "BudgetFlow Backend API",
        "version": "1.0.0",
        **db_details
    }, status=200 if db_ok else 503)

urlpatterns = [
    path('', health_check, name='root-health'),
    path('api/health/', health_check, name='api-health'),
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('custom_auth.urls')),
    path('api/', include('finance.urls')),
    path('api/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
