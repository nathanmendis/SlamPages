import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar = models.TextField(blank=True, null=True, help_text="Path or URL to profile avatar")
    verified = models.BooleanField(default=False, help_text="True if the user is a verified creator/member")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username
