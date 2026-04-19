from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken
from urllib.parse import urlencode


class GoogleLogin(SocialLoginView):
    """REST endpoint for exchanging a Google token for a JWT (used by SPA clients)."""
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:8000/accounts/google/login/callback/"
    client_class = OAuth2Client


from django.conf import settings

@login_required
def google_login_callback(request):
    """
    After Django allauth completes the Google OAuth flow (server-side redirect),
    this view generates a JWT for the authenticated user and redirects them
    back to the React frontend with the tokens in the URL query parameters.
    """
    user = request.user

    # Generate JWT tokens for the logged-in user
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # Redirect to the React frontend with the tokens
    frontend_url = f"{settings.FRONTEND_URL}/auth/callback/google"
    params = urlencode({
        'access_token': access_token,
        'refresh_token': refresh_token,
    })
    return redirect(f"{frontend_url}?{params}")
