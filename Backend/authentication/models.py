import uuid
import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar = models.TextField(blank=True, null=True, help_text="Path or URL to profile avatar")
    verified = models.BooleanField(default=False, help_text="True if the user is a verified creator/member")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class PasswordResetToken(models.Model):
    """
    Secure, one-time-use password reset token with a 10-minute TTL.
    Daily rate limit (max 3 resets per user per calendar day) is enforced
    in the views by counting tokens created today for that user.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Set expiry on first creation if not already provided
        if not self.expires_at:
            self.expires_at = timezone.now() + datetime.timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_valid(self):
        """Returns True only if the token has not been used and has not expired."""
        return not self.used and timezone.now() < self.expires_at

    def __str__(self):
        if self.used:
            state = "used"
        elif timezone.now() >= self.expires_at:
            state = "expired"
        else:
            state = "valid"
        return f"ResetToken({self.user.username}, {state})"
