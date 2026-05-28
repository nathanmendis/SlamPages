import sys
from google_auth_oauthlib.flow import InstalledAppFlow
import os

# Specify scopes: we only request the 'gmail.send' scope to securely transmit emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("=========================================================")
    print(" Google OAuth2 Offline Refresh Token Retrieval Helper ")
    print("=========================================================")
    print("\nIMPORTANT REQUIREMENT:")
    print("Before executing this script, make sure you have added:")
    print("  --> http://localhost:8080/")
    print("to your 'Authorized redirect URIs' in the Google Cloud Console")
    print("for this specific OAuth 2.0 Client ID!\n")
    
    input("Press Enter once you have added 'http://localhost:8080/' to Google Cloud redirect URIs...")

    # Programmatic OAuth 2.0 config structure
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }

    try:
        # Build local consent flow
        flow = InstalledAppFlow.from_client_config(client_config, scopes=SCOPES)
        
        print("\nStarting local authentication server...")
        print("Opening your browser to Google consent screen...")
        
        # Open browser and request offline consent approval
        creds = flow.run_local_server(
            port=8080,
            prompt='consent',
            access_type='offline'
        )

        print("\n=========================================================")
        print(" AUTHORIZATION SUCCESSFUL! ")
        print("=========================================================")
        print(f"\nGOOGLE_CLIENT_ID={creds.client_id}")
        print(f"GOOGLE_CLIENT_SECRET={creds.client_secret}")
        print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
        print("\n=========================================================")
        print("Copy the GOOGLE_REFRESH_TOKEN value above and paste it into your")
        print("d:\\Code\\Slam\\Backend\\.env file!")
        print("=========================================================")

    except Exception as e:
        print(f"\nError occurred: {e}")
        print("Make sure you are not running another process on port 8080.")

if __name__ == '__main__':
    main()
