from django.contrib import admin
from django.urls import path, include
from users.views import GoogleLogin, google_login_callback

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth endpoints
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # Google Auth (REST endpoint for SPA token exchange)
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),

    # Custom callback: after allauth completes Google login, generate JWT and redirect to React
    path('api/auth/google/callback/', google_login_callback, name='google_login_callback'),

    # Allauth views (handles the /accounts/google/login/ redirect flow)
    path('accounts/', include('allauth.urls')),
    
    # App routers
    path('api/materials/', include('materials.urls')),
    path('api/chat/', include('chat.urls')),
]
