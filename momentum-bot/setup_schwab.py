"""
Schwab OAuth Authentication Setup
Run this once to get your refresh token
"""
from src.data.schwab_client import SchwabAuthClient
from config.settings import SCHWAB_APP_KEY, SCHWAB_APP_SECRET, SCHWAB_CALLBACK_URL
import webbrowser

def setup_schwab_auth():
    """Guide user through Schwab OAuth flow"""

    print("="*60)
    print("SCHWAB OAUTH SETUP")
    print("="*60)
    print()

    if not SCHWAB_APP_KEY or not SCHWAB_APP_SECRET:
        print("❌ Missing Schwab API credentials!")
        print()
        print("1. Go to https://developer.schwab.com")
        print("2. Create an app and get your App Key and Secret")
        print("3. Add them to your .env file:")
        print("   SCHWAB_APP_KEY=your_key")
        print("   SCHWAB_APP_SECRET=your_secret")
        print()
        return

    auth_client = SchwabAuthClient(
        app_key=SCHWAB_APP_KEY,
        app_secret=SCHWAB_APP_SECRET,
        callback_url=SCHWAB_CALLBACK_URL
    )

    # Get authorization URL
    auth_url = auth_client.get_authorization_url()

    print("Step 1: Authorize the app")
    print("-" * 60)
    print("Opening browser to Schwab authorization page...")
    print()
    print(f"If browser doesn't open, visit this URL:")
    print(auth_url)
    print()

    # Open browser
    webbrowser.open(auth_url)

    print("Step 2: After authorizing, you'll be redirected to your callback URL")
    print("The URL will contain a 'code' parameter")
    print()
    auth_code = input("Paste the full callback URL or just the code: ").strip()

    # Extract code if full URL was pasted
    if 'code=' in auth_code:
        auth_code = auth_code.split('code=')[1].split('&')[0]

    print()
    print("Step 3: Exchanging code for tokens...")
    print()

    try:
        auth_client.authenticate(auth_code)

        print("✅ Authentication successful!")
        print()
        print("Your refresh token (SAVE THIS):")
        print("-" * 60)
        print(auth_client.refresh_token)
        print("-" * 60)
        print()
        print("Add this to your .env file:")
        print(f"SCHWAB_REFRESH_TOKEN={auth_client.refresh_token}")
        print()
        print("Also get your account hash:")
        print("1. Log into Schwab thinkorswim")
        print("2. Go to Account -> Account Info")
        print("3. Copy your account number")
        print("4. Add to .env: SCHWAB_ACCOUNT_HASH=your_account_number")
        print()

    except Exception as e:
        print(f"❌ Authentication failed: {e}")

if __name__ == "__main__":
    setup_schwab_auth()
