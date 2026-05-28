import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

def send_gmail_api_email(to_email, subject, body_text):
    """
    Sends an email using the Google Gmail API v1 over OAuth2.
    """
    from django.conf import settings
    
    # Extract Google OAuth credentials from settings
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', None)
    refresh_token = getattr(settings, 'GOOGLE_REFRESH_TOKEN', None)
    
    if not (client_id and client_secret and refresh_token):
        print("[Gmail API] Credentials not fully configured in settings. Email send skipped.")
        print(f"To: {to_email} | Subject: {subject} | Body: {body_text[:50]}...")
        return False
        
    # Build OAuth2 Credentials using the offline server-to-server refresh token
    creds = Credentials(
        token=None,  # Automatically populated on refresh
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret
    )
    
    # Refresh the access token
    try:
        creds.refresh(Request())
    except Exception as e:
        print(f"[Gmail API] Failed to refresh Google OAuth2 Access Token: {e}")
        return False
        
    # Send message using the official Google API Client
    try:
        service = build('gmail', 'v1', credentials=creds)
        
        # Compile MIME message
        message = MIMEText(body_text)
        message['to'] = to_email
        message['subject'] = subject
        
        # Base64url encode the message raw bytes
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        # Transmit via Gmail API
        send_result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        print(f"[Gmail API] Email successfully sent! Message ID: {send_result.get('id')}")
        return True
    except Exception as e:
        print(f"[Gmail API] Transmission failed: {e}")
        return False
