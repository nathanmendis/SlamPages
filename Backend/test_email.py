import os
import django

# Bootstrap the Django environment to load settings and credentials from .env
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'slam.settings')
django.setup()

from authentication.gmail_helper import send_gmail_api_email

def main():
    print("=========================================================")
    print(" SlamBook Gmail API Transmission Tester ")
    print("=========================================================")
    
    recipient = "nathanmendis17@gmail.com"
    subject = "SlamBook Gmail API Integration — Successful Test!"
    body = (
        "Hello Nathan!\n\n"
        "Congratulations! This test email was successfully dispatched "
        "via the official Google Gmail API (v1) using your secure OAuth 2.0 "
        "Client ID, Client Secret, and your newly generated offline Refresh Token.\n\n"
        "This successfully replaces traditional SMTP with a modern, secure, "
        "and production-grade Google Cloud API transmission, avoiding any port "
        "or hosting blocks.\n\n"
        "Your password recovery system will now leverage this exact helper to mail "
        "reset tokens directly to users.\n\n"
        "Best regards,\n"
        "SlamBook Pairing AI Assistant"
    )
    
    print(f"\nAttempting to transmit email to: {recipient}...")
    success = send_gmail_api_email(recipient, subject, body)
    
    print("=========================================================")
    if success:
        print(" SUCCESS: The test email was successfully sent!")
        print(f" Please check your inbox/spam folder at: {recipient}")
    else:
        print(" FAILURE: Transmission failed. Check the error logs above.")
    print("=========================================================")

if __name__ == '__main__':
    main()
