import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


def send_gmail_api_email(to_email, subject, body_text, body_html=None):
    """
    Sends an email using the Google Gmail API v1 over OAuth2.
    Supports both plain-text fallback and rich HTML body.
    If body_html is provided, the email is sent as multipart/alternative.
    """
    from django.conf import settings

    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', None)
    refresh_token = getattr(settings, 'GOOGLE_REFRESH_TOKEN', None)

    if not (client_id and client_secret and refresh_token):
        print("[Gmail API] Credentials not fully configured in settings. Email send skipped.")
        print(f"To: {to_email} | Subject: {subject} | Body: {body_text[:80]}...")
        return False

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret
    )

    try:
        creds.refresh(Request())
    except Exception as e:
        print(f"[Gmail API] Failed to refresh Google OAuth2 Access Token: {e}")
        return False

    try:
        service = build('gmail', 'v1', credentials=creds)

        if body_html:
            # Rich multipart email — clients show HTML, plain as fallback
            message = MIMEMultipart('alternative')
            message['to'] = to_email
            message['subject'] = subject
            message.attach(MIMEText(body_text, 'plain'))
            message.attach(MIMEText(body_html, 'html'))
        else:
            message = MIMEText(body_text, 'plain')
            message['to'] = to_email
            message['subject'] = subject

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')

        send_result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()

        print(f"[Gmail API] Email successfully sent! Message ID: {send_result.get('id')}")
        return True
    except Exception as e:
        print(f"[Gmail API] Transmission failed: {e}")
        return False
