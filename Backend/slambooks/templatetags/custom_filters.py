import base64
from django import template
from django.conf import settings
from pathlib import Path

register = template.Library()

@register.filter
def base64_encode(value):
    """
    Converts an image URL or file path to a base64-encoded string.
    Handles relative file paths from MEDIA_ROOT.
    """
    if not value:
        return ""
    
    try:
        # If it's a file path (relative or absolute), read it
        if isinstance(value, str):
            # Check if it's a relative path in media folder
            if not value.startswith(('http://', 'https://', '/')):
                file_path = Path(settings.MEDIA_ROOT) / value
            else:
                file_path = Path(value)
            
            if file_path.exists():
                with open(file_path, 'rb') as f:
                    image_data = f.read()
                # Encode to base64
                encoded = base64.b64encode(image_data).decode('utf-8')
                return encoded
        
        return ""
    except Exception as e:
        print(f"Error encoding image to base64: {e}")
        return ""
