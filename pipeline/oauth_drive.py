"""Builds a Drive service authenticated as troop650rc@gmail.com via OAuth.

Used only for the GroupMe inbox upload step — the SA handles everything else.
Credentials come from three GitHub secrets:
  GOOGLE_OAUTH_TOKEN         — refresh token minted once via mint_token.py
  GOOGLE_OAUTH_CLIENT_ID     — OAuth Desktop app client_id
  GOOGLE_OAUTH_CLIENT_SECRET — OAuth Desktop app client_secret
"""
import os
from functools import lru_cache

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/drive.file"]


@lru_cache(maxsize=1)
def oauth_drive_svc():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_OAUTH_TOKEN"],
        client_id=os.environ["GOOGLE_OAUTH_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES,
    )
    # Refresh immediately so any credential error surfaces at startup not mid-run.
    creds.refresh(Request())
    return build("drive", "v3", credentials=creds, cache_discovery=False)
