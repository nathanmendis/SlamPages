from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, UserProfileView, 
    GoogleOAuthPlaceholderView, PasswordResetRequestView, PasswordResetConfirmView
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth_register'),
    path('login', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('me', UserProfileView.as_view(), name='user_profile'),
    path('google', GoogleOAuthPlaceholderView.as_view(), name='google_oauth_placeholder'),
    path('password-reset', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
