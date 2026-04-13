import os
import json
import ssl
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import certifi
import firebase_admin
from firebase_admin import auth, credentials


_firebase_app = None
_IDENTITY_TOOLKIT_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup"


def _service_account_path() -> str | None:
    explicit = (os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH") or "").strip()
    if explicit:
        return explicit

    # Fallback to the standard Google credentials env var when available.
    gcp_path = (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if gcp_path:
        return gcp_path

    return None


def _service_account_payload() -> dict[str, str | None]:
    return {
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "privateKey": (os.getenv("FIREBASE_PRIVATE_KEY") or "").replace("\\n", "\n"),
        "clientEmail": os.getenv("FIREBASE_CLIENT_EMAIL"),
    }


def _firebase_web_api_key() -> str:
    return (os.getenv("FIREBASE_WEB_API_KEY") or "").strip()


def _verify_via_identity_toolkit(id_token: str) -> dict:
    api_key = _firebase_web_api_key()
    if not api_key:
        raise RuntimeError(
            "Firebase Admin is not configured. Set service-account env vars or FIREBASE_WEB_API_KEY for local development."
        )

    body = json.dumps({"idToken": id_token}).encode("utf-8")
    request = Request(
        f"{_IDENTITY_TOOLKIT_LOOKUP_URL}?key={api_key}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    # Enforce modern TLS to satisfy secure-transport requirements.
    ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2

    try:
        with urlopen(request, timeout=10, context=ssl_context) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore")
        try:
            data = json.loads(raw)
            reason = (data.get("error") or {}).get("message") or "Invalid Firebase token"
        except json.JSONDecodeError:
            reason = "Invalid Firebase token"
        raise ValueError(reason) from exc
    except (URLError, TimeoutError, ssl.SSLError) as exc:
        reason = str(getattr(exc, "reason", "") or str(exc) or "unknown network error")
        raise RuntimeError(f"Unable to reach Firebase token verification endpoint: {reason}") from exc

    users = payload.get("users") or []
    if not users:
        raise ValueError("Firebase token verification failed")

    user = users[0]
    provider_info = user.get("providerUserInfo") or []
    provider = "custom"
    if provider_info:
        provider = provider_info[0].get("providerId") or provider

    return {
        "uid": user.get("localId"),
        "email": user.get("email"),
        "name": user.get("displayName"),
        "email_verified": bool(user.get("emailVerified")),
        "firebase": {"sign_in_provider": provider},
    }


def init_firebase_admin() -> bool:
    global _firebase_app

    if _firebase_app is not None:
        return True

    credential = None

    service_account_path = _service_account_path()
    if service_account_path:
        resolved = Path(service_account_path).expanduser()
        if resolved.exists() and resolved.is_file():
            credential = credentials.Certificate(str(resolved))

    if credential is None:
        payload = _service_account_payload()
        if not payload["projectId"] or not payload["privateKey"] or not payload["clientEmail"]:
            return False

        credential = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": payload["projectId"],
                "private_key": payload["privateKey"],
                "client_email": payload["clientEmail"],
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )

    _firebase_app = firebase_admin.initialize_app(credential)
    return True


def verify_firebase_id_token(id_token: str) -> dict:
    if init_firebase_admin():
        return auth.verify_id_token(id_token)

    return _verify_via_identity_toolkit(id_token)
