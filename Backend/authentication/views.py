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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from .gmail_helper import send_gmail_api_email

        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            # The link points to our React frontend
            frontend_url = "http://localhost:5173"
            reset_link = f"{frontend_url}/reset-password/{uidb64}/{token}"

            subject = "Reset your SlamBook Password"
            body = (
                f"Hello {user.username},\n\n"
                f"You requested a password reset for your SlamBook account. "
                f"Click the link below to enter a new password:\n\n"
                f"{reset_link}\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"Best regards,\nSlamBook Team"
            )

            # Transmit via Google Gmail API
            send_gmail_api_email(user.email, subject, body)

        # Standard secure response: return 200 regardless to prevent user email enumeration
        return Response({
            'message': 'If an account with this email exists, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('password')

        if not (uidb64 and token and new_password):
            return Response({'error': 'uidb64, token, and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid or expired password reset link.'}, status=status.HTTP_400_BAD_REQUEST)
