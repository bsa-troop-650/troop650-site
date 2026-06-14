"""Auth + client singletons. Credentials come from the GCP_SA_KEY env var
(the full service-account JSON, stored as a GitHub Actions secret)."""
import json
import os
from functools import lru_cache

from google.oauth2 import service_account
from googleapiclient.discovery import build
import firebase_admin
from firebase_admin import credentials as fb_credentials, firestore, storage

from .config import STORAGE_BUCKET

SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/drive",
]


@lru_cache(maxsize=1)
def _sa_info():
    raw = os.environ.get("GCP_SA_KEY")
    if not raw:
        raise RuntimeError("GCP_SA_KEY env var is not set")
    return json.loads(raw)


@lru_cache(maxsize=1)
def google_creds():
    return service_account.Credentials.from_service_account_info(_sa_info(), scopes=SCOPES)


@lru_cache(maxsize=1)
def calendar_svc():
    return build("calendar", "v3", credentials=google_creds(), cache_discovery=False)


@lru_cache(maxsize=1)
def drive_svc():
    return build("drive", "v3", credentials=google_creds(), cache_discovery=False)


@lru_cache(maxsize=1)
def _fb_app():
    cred = fb_credentials.Certificate(_sa_info())
    return firebase_admin.initialize_app(cred, {"storageBucket": STORAGE_BUCKET})


def db():
    _fb_app()
    return firestore.client()


def bucket():
    _fb_app()
    return storage.bucket()
