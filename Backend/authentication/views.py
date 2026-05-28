from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                'user': user_data,
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    # Overriding post to return serialized user information alongside tokens
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            username = request.data.get('username')
            # Fetch user details
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                # Username could be email depending on auth setup
                user = User.objects.filter(email=username).first()
            
            if user:
                user_data = UserSerializer(user).data
                response.data['user'] = user_data
        return response

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GoogleOAuthPlaceholderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from google.oauth2 import id_token
        from google.auth.transport import requests
        from django.conf import settings

        token = request.data.get('token')
        if not token:
            return Response({'error': 'Google token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Cryptographically verify the Google ID token
            id_info = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60  # Allow up to 60 seconds of clock skew to prevent strict time errors
            )
            
            # Retrieve verified profile information from the token payload
            email = id_info.get('email')
            name = id_info.get('name') or email.split('@')[0]
            avatar = id_info.get('picture', '')

            # Check if this email already exists
            user = User.objects.filter(email=email).first()
            
            if not user:
                # Generate a unique username if a collision exists
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                # Auto-register new Google user
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    avatar=avatar,
                    verified=True # Google verified users automatically receive a verified badge
                )

            # Generate Django JWT tokens for this user's active session
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                'user': user_data,
                'tokens': tokens,
                'info': 'Successfully authenticated via Google OAuth2 ID Token verification'
            }, status=status.HTTP_200_OK)

        except ValueError as ve:
            print("Google token verification ValueError:", ve)
            return Response({'error': f'Invalid or expired Google Token: {str(ve)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Google token verification Exception:", e)
            return Response({'error': f'Google authentication failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(APIView):
    """
    Sends a one-time password reset link valid for 10 minutes.
    Users are limited to 3 reset requests per calendar day.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import secrets
        from django.utils import timezone
        from .gmail_helper import send_gmail_api_email
        from .models import PasswordResetToken

        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            # --- Daily rate limit: max 3 reset requests per calendar day ---
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            resets_today = PasswordResetToken.objects.filter(
                user=user,
                created_at__gte=today_start
            ).count()

            if resets_today >= 3:
                return Response({
                    'error': 'You have exceeded the daily limit of 3 password resets today. Please wait until tomorrow for the limit to refresh.'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            # Invalidate any previous unused tokens for this user
            PasswordResetToken.objects.filter(user=user, used=False).update(used=True)

            # Create a new secure one-time token (expires in 10 min via model.save)
            raw_token = secrets.token_urlsafe(48)
            reset_token = PasswordResetToken.objects.create(user=user, token=raw_token)

            frontend_url = "http://localhost:5173"
            reset_link = f"{frontend_url}/reset-password/{reset_token.id}/{raw_token}"

            subject = "Reset your SlamBook Password 📖"

            # Plain-text fallback
            body_text = (
                f"Hello {user.username},\n\n"
                f"You requested a password reset for your SlamBook account.\n"
                f"Click the link below to set a new password.\n"
                f"This link expires in 10 minutes and can only be used once.\n\n"
                f"{reset_link}\n\n"
                f"If you did not request this, your account is safe — just ignore this email.\n\n"
                f"Best regards,\nSlamBook Team"
            )

            # Themed HTML email — scrapbook / notebook aesthetic
            body_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your SlamBook Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

          <!-- Header tape strip -->
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <div style="display:inline-block;background:rgba(254,240,138,0.75);width:80px;height:20px;border-radius:2px;transform:rotate(-2deg);"></div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background-color:#fbfbf6;
              background-image:repeating-linear-gradient(0deg,transparent,transparent 27px,#e2e8f0 27px,#e2e8f0 28px);
              border:1px solid #e5e5d8;
              border-left:4px solid rgba(239,68,68,0.35);
              border-radius:16px;
              padding:40px 40px 36px 48px;
              box-shadow:0 4px 24px rgba(0,0,0,0.07);
            ">
              <!-- Logo row -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="
                      display:inline-flex;
                      align-items:center;
                      justify-content:center;
                      background:#fef3c7;
                      border-radius:14px;
                      width:52px;height:52px;
                      font-size:26px;
                      line-height:52px;
                      text-align:center;
                    ">📖</div>
                    <div style="margin-top:12px;font-size:22px;font-weight:bold;color:#78350f;letter-spacing:-0.5px;">
                      SlamBook
                    </div>
                    <div style="font-size:11px;color:#a8a29e;font-family:sans-serif;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">
                      Memory Scrapbook
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px dashed #d6cfc5;margin:0 0 28px 0;" />

              <!-- Greeting -->
              <p style="margin:0 0 8px 0;font-size:17px;color:#44403c;font-weight:bold;">
                Hello, {user.username} 
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#78716c;line-height:1.7;font-family:sans-serif;">
                We received a request to reset the password for your SlamBook account.
                Click the button below to choose a new one. This link is valid for
                <strong style="color:#92400e;">10 minutes</strong> and can only be used once.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px 0;">
                    <a href="{reset_link}"
                       style="
                         display:inline-block;
                         background-color:#78350f;
                         color:#ffffff;
                         text-decoration:none;
                         font-family:sans-serif;
                         font-size:15px;
                         font-weight:bold;
                         padding:14px 36px;
                         border-radius:12px;
                         letter-spacing:0.3px;
                         box-shadow:0 4px 12px rgba(120,53,15,0.25);
                       ">
                       Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 24px 0;font-size:12px;color:#a8a29e;font-family:sans-serif;text-align:center;line-height:1.6;">
                Button not working? Copy and paste this link into your browser:<br/>
                <a href="{reset_link}" style="color:#92400e;word-break:break-all;">{reset_link}</a>
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px dashed #d6cfc5;margin:0 0 20px 0;" />

              <!-- Safety note -->
              <p style="margin:0;font-size:12px;color:#a8a29e;font-family:sans-serif;line-height:1.6;text-align:center;">
                If you didn't request a password reset, your account is safe — just ignore this email.<br/>
                Never share this link with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#a8a29e;font-family:sans-serif;">
                © 2026 SlamBook · Made with 💖 for lifelong memories
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

            send_gmail_api_email(user.email, subject, body_text, body_html=body_html)

        # Always 200 to prevent user email enumeration
        return Response({
            'message': 'If an account with this email exists, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    GET  — Validates the token and returns the remaining password resets allowed today.
    POST — Validates the token, resets the password, and returns success with remaining resets.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import PasswordResetToken
        from django.utils import timezone

        token_id = request.query_params.get('uidb64')
        raw_token = request.query_params.get('token')

        if not (token_id and raw_token):
            return Response(
                {'error': 'uidb64 and token are required in query parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(
                id=token_id,
                token=raw_token
            )
        except (PasswordResetToken.DoesNotExist, Exception):
            return Response(
                {'error': 'Invalid or expired password reset link.', 'valid': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not reset_token.is_valid():
            return Response(
                {'error': 'This reset link has already been used or has expired.', 'valid': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate remaining resets today
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        resets_today = PasswordResetToken.objects.filter(
            user=reset_token.user,
            created_at__gte=today_start
        ).count()
        resets_remaining = max(0, 3 - resets_today)

        return Response({
            'valid': True,
            'resets_remaining': resets_remaining,
            'username': reset_token.user.username
        }, status=status.HTTP_200_OK)

    def post(self, request):
        from .models import PasswordResetToken
        from django.utils import timezone

        token_id = request.data.get('uidb64')
        raw_token = request.data.get('token')
        new_password = request.data.get('password')

        if not (token_id and raw_token and new_password):
            return Response(
                {'error': 'token_id, token, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(
                id=token_id,
                token=raw_token
            )
        except (PasswordResetToken.DoesNotExist, Exception):
            return Response(
                {'error': 'Invalid or expired password reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not reset_token.is_valid():
            return Response(
                {'error': 'This reset link has already been used or has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark as used BEFORE setting password to prevent race conditions
        reset_token.used = True
        reset_token.save(update_fields=['used'])

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        # Calculate remaining resets today (should be same/updated limit)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        resets_today = PasswordResetToken.objects.filter(
            user=user,
            created_at__gte=today_start
        ).count()
        resets_remaining = max(0, 3 - resets_today)

        return Response({
            'message': 'Password has been reset successfully.',
            'resets_remaining': resets_remaining
        }, status=status.HTTP_200_OK)
