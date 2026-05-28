import hashlib
import os
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from django.core.cache import cache
from better_profanity import profanity

from .models import SlamBook, SlamQuestion, SlamEntry, Report
from .serializers import SlamBookSerializer, SlamEntrySerializer, ReportSerializer
from .tasks import generate_slam_pdf

# Load profanity dictionary
profanity.load_censor_words()

def get_client_ip(request):
    """Utility function to extract client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def hash_ip(ip):
    """Hashes IP address for secure, anonymous abuse prevention tracking"""
    if not ip:
        return ""
    return hashlib.sha256(ip.encode('utf-8')).hexdigest()

class AnonSubmissionsThrottle(SimpleRateThrottle):
    """Custom Redis-backed rate limiter for anonymous submissions"""
    scope = 'anon_submissions'
    
    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            # Authenticated users bypass anonymous throttle
            return None
        # Limit by client IP hash
        return self.get_ident(request)

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow owners of a slam book to edit it"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

class HealthCheckView(APIView):
    """Simple health check endpoint for uptime and basic backend readiness."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Database readiness check
        try:
            connections['default'].cursor()
        except OperationalError:
            return Response(
                {'status': 'error', 'database': 'unavailable'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Cache readiness check (optional, non-fatal)
        cache_status = 'unavailable'
        try:
            cache.set('health_check', 'ok', timeout=5)
            if cache.get('health_check') == 'ok':
                cache_status = 'ok'
        except Exception:
            cache_status = 'unavailable'

        return Response(
            {
                'status': 'ok',
                'database': 'ok',
                'cache': cache_status,
                'message': 'Backend is awake and functioning.'
            },
            status=status.HTTP_200_OK
        )


# --- SlamBook Endpoints ---

class SlamBookCreateView(generics.ListCreateAPIView):
    """Endpoint for authenticated users to list and create Slam Books"""
    serializer_class = SlamBookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter slam books to only return those owned by the logged-in user
        return SlamBook.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class SlamBookDetailView(APIView):
    """Endpoint to fetch a Slam Book by its unique slug (owner-only access)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        slam_book = get_object_or_404(SlamBook, slug=slug)
        
        # Only allow the owner to view the book
        if slam_book.owner != request.user:
            return Response(
                {'error': 'You do not have permission to view this slam book.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SlamBookSerializer(slam_book)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SlamBookUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Endpoint for owners to update (PATCH) or delete a Slam Book"""
    queryset = SlamBook.objects.all()
    serializer_class = SlamBookSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

# --- Entry Endpoints ---

class SlamEntryCreateView(APIView):
    """Public endpoint to submit a Slam Entry, with rate-limiting and profanity checks"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonSubmissionsThrottle]

    def post(self, request):
        slam_book_id = request.data.get('slam_book')
        slam_book = get_object_or_404(SlamBook, id=slam_book_id)

        # Parse and moderate answers using profanity filter
        answers = request.data.get('answers', {})
        if isinstance(answers, str):
            import json
            try:
                answers = json.loads(answers)
            except json.JSONDecodeError:
                answers = {}

        censored_answers = {}
        for q_id, ans in answers.items():
            if isinstance(ans, str):
                censored_answers[q_id] = profanity.censor(ans)
            else:
                censored_answers[q_id] = ans

        # Extract anonymous info and trackers
        anonymous_name = request.data.get('anonymous_name')
        # Theme is always inherited from the book owner's setting — never from the submitter
        theme = slam_book.theme
        image_file = request.FILES.get('image_url') # Handles multi-part file uploads

        # Capturing metadata for abuse logging
        ip = get_client_ip(request)
        ip_hash = hash_ip(ip)
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Build Entry instance
        author = request.user if request.user.is_authenticated else None
        
        entry = SlamEntry(
            slam_book=slam_book,
            author=author,
            anonymous_name=anonymous_name,
            answers=censored_answers,
            theme=theme,
            image_url=image_file,
            ip_hash=ip_hash,
            user_agent=user_agent
        )
        entry.save()

        serializer = SlamEntrySerializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SlamEntryListView(APIView):
    """Endpoint to fetch entries written inside a specific Slam Book"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, book_id):
        slam_book = get_object_or_404(SlamBook, id=book_id)
        entries = slam_book.entries.all().order_by('-created_at')
        serializer = SlamEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SlamEntryDeleteView(APIView):
    """Endpoint allowing the Slam Book owner to delete inappropriate submissions"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, id):
        entry = get_object_or_404(SlamEntry, id=id)
        # Check if the requesting user is the owner of the SlamBook
        if entry.slam_book.owner != request.user:
            return Response(
                {'error': 'You do not have permission to delete entries from this slam book.'},
                status=status.HTTP_403_FORBIDDEN
            )
        entry.delete()
        return Response({'message': 'Entry successfully removed.'}, status=status.HTTP_200_OK)

# --- PDF Endpoint ---

class GeneratePDFView(APIView):
    """Endpoint to trigger the background Celery task for PDF compilation"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, book_id):
        slam_book = get_object_or_404(SlamBook, id=book_id)
        
        # Enforce that only the owner can generate the printable PDF
        if slam_book.owner != request.user:
            return Response(
                {'error': 'You do not have permission to generate printable documents for this slam book.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Trigger Celery task asynchronously
        task = generate_slam_pdf.delay(str(book_id))
        
        pdf_filename = f"{book_id}.pdf"
        download_url = f"{settings.MEDIA_URL}pdfs/{pdf_filename}"

        return Response({
            'message': 'PDF generation task scheduled successfully.',
            'task_id': task.id,
            'download_url': download_url,
            'status': 'PENDING'
        }, status=status.HTTP_202_ACCEPTED)

# --- Report Endpoint ---

class ReportCreateView(generics.CreateAPIView):
    """Public endpoint to flag an entry for abuse/moderation"""
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]
