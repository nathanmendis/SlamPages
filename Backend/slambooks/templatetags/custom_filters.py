import base64
import mimetypes
from django import template
from django.conf import settings
from pathlib import Path

register = template.Library()

@register.filter
def base64_encode(value):
    """
    Converts an image URL or file path to a base64-encoded data URI.
    Handles relative file paths from MEDIA_ROOT.
    """
    if not value:
        return ""
    
    try:
        file_path = None
        # Handle Django FieldFile objects (ImageField instances)
        if hasattr(value, 'path'):
            file_path = Path(value.path)
        # If it's a file path string (relative or absolute), read it
        elif isinstance(value, str):
            # Check if it's a relative path in media folder
            if not value.startswith(('http://', 'https://', '/')):
                file_path = Path(settings.MEDIA_ROOT) / value
            else:
                file_path = Path(value)
        
        if file_path and file_path.exists():
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if not mime_type:
                # Default to png or jpeg based on suffix
                suffix = file_path.suffix.lower()
                if suffix in ['.jpg', '.jpeg']:
                    mime_type = 'image/jpeg'
                elif suffix == '.gif':
                    mime_type = 'image/gif'
                elif suffix == '.webp':
                    mime_type = 'image/webp'
                else:
                    mime_type = 'image/png'

            with open(file_path, 'rb') as f:
                image_data = f.read()
            # Encode to base64 and return as complete data URI
            encoded = base64.b64encode(image_data).decode('utf-8')
            return f"data:{mime_type};base64,{encoded}"
        
        return ""
    except Exception as e:
        print(f"Error encoding image to base64: {e}")
        return ""
