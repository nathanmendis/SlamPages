import uuid
from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model

User = get_user_model()

class SlamBook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='slambooks')
    slug = models.SlugField(max_length=255, unique=True, help_text="Unique slug for public slam book link")
    title = models.CharField(max_length=255, help_text="Title of the slam book")
    description = models.TextField(blank=True, null=True, help_text="Slam book bio or introduction")
    cover_image = models.ImageField(upload_to='covers/', blank=True, null=True, help_text="Optional scrapbook cover image")
    theme = models.CharField(max_length=100, default='School Notebook', help_text="Themes: School Notebook, Y2K, Diary, Polaroid, Dark Academia")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.owner.username}"

    def save(self, *args, **kwargs):
        # Auto-generate slug using title and owner's username if not provided
        if not self.slug:
            base_slug = slugify(self.title)
            user_slug = slugify(self.owner.username)
            potential_slug = f"{base_slug}-{user_slug}"
            
            # Handle duplicates by appending a counter (e.g., "test-alice-2")
            if SlamBook.objects.filter(slug=potential_slug).exists():
                counter = 2
                while SlamBook.objects.filter(slug=f"{potential_slug}-{counter}").exists():
                    counter += 1
                self.slug = f"{potential_slug}-{counter}"
            else:
                self.slug = potential_slug
        super().save(*args, **kwargs)

class SlamQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slam_book = models.ForeignKey(SlamBook, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField(help_text="Custom question content")
    order = models.IntegerField(default=0, help_text="Position of the question card")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q: {self.question[:30]}... ({self.slam_book.title})"

class SlamEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slam_book = models.ForeignKey(SlamBook, on_delete=models.CASCADE, related_name='entries')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='entries_written', help_text="Null if anonymous submission")
    anonymous_name = models.CharField(max_length=255, blank=True, null=True, help_text="Creator name if guest/anonymous")
    answers = models.JSONField(help_text="Key-value mapping of answers where key is question UUID or question text")
    theme = models.CharField(max_length=100, default='School Notebook', help_text="Selected layout theme for this page")
    image_url = models.ImageField(upload_to='entries/', blank=True, null=True, help_text="Optional uploaded picture or polaroid sticker")
    ip_hash = models.CharField(max_length=64, blank=True, null=True, help_text="SHA256 hash of submitter IP address for rate-limiting")
    user_agent = models.TextField(blank=True, null=True, help_text="Browser client user-agent")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        writer = self.author.username if self.author else (self.anonymous_name or "Anonymous")
        return f"Entry by {writer} in {self.slam_book.title}"

class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed')
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entry = models.ForeignKey(SlamEntry, on_delete=models.CASCADE, related_name='reports')
    reason = models.TextField(help_text="Reason for reporting this entry")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report on {self.entry.id} - status: {self.status}"

# --- Database Deletion Signals (Media Cleaner) ---
import os
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.conf import settings

@receiver(post_delete, sender=SlamBook)
def delete_slambook_media(sender, instance, **kwargs):
    """
    Cleans up the book's cover image and compiled PDF from the
    local filesystem when a SlamBook instance is deleted.
    """
    # 1. Delete cover image file
    if instance.cover_image:
        try:
            if os.path.exists(instance.cover_image.path):
                os.remove(instance.cover_image.path)
        except Exception:
            pass

    # 2. Delete generated PDF file
    try:
        pdf_path = os.path.join(settings.MEDIA_ROOT, 'pdfs', f"{instance.id}.pdf")
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
    except Exception:
        pass

@receiver(post_delete, sender=SlamEntry)
def delete_slamentry_media(sender, instance, **kwargs):
    """
    Cleans up individual guest-attached photos/stickers from
    the local filesystem when a SlamEntry instance is deleted.
    """
    if instance.image_url:
        try:
            if os.path.exists(instance.image_url.path):
                os.remove(instance.image_url.path)
        except Exception:
            pass
