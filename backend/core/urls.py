"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from django.db.utils import OperationalError

def health_check(request):
    """
    Health check endpoint that verifies:
    1. API is reachable
    2. Database connection is active
    """
    health_status = {
        'status': 'ok',
        'database': 'unknown',
        'message': 'Arth-Neeti API is running!',
        'version': 'v1'
    }
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            if row:
                health_status['database'] = 'connected'
    except OperationalError:
        health_status['status'] = 'degraded'
        health_status['database'] = 'disconnected'
        health_status['message'] = 'Database unavailable'
        return JsonResponse(health_status, status=503)
    except Exception as e:
        health_status['status'] = 'error'
        health_status['database'] = 'error'
        health_status['error'] = str(e)
        return JsonResponse(health_status, status=500)

    return JsonResponse(health_status)


urlpatterns = [
    path('', health_check, name='health'), # Root health check
    path('health-check/', health_check, name='health_explicit'),
    path('admin/', admin.site.urls),
    
    # Versioned API
    path('api/v1/', include('game_engine.urls')),
    
    # Legacy API support (for immediate backward compatibility)
    path('api/', include('game_engine.urls')),
]

