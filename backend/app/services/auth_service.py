from datetime import datetime, timezone
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.config.database import get_session
from app.model.models import User, VendorDocument
from app.services.email_service import send_email
from app.services.password_service import hash_password, is_password_hash, verify_password


ALLOWED_VENDOR_DOC_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_VENDOR_DOC_BYTES = 5 * 1024 * 1024
VENDOR_DOC_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "vendor_docs"
DEFAULT_FIREBASE_USER_NAME = "Firebase User"
EMAIL_VERIFY_TTL_SECONDS = int(os.getenv("EMAIL_VERIFY_TTL_SECONDS", "86400"))
EMAIL_VERIFY_SECRET = os.getenv("APP_SECRET_KEY", "ticket-nepal-dev-secret-change")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("APP_SECRET_KEY", "ticket-nepal-jwt-secret-change"))
JWT_ISSUER = os.getenv("JWT_ISSUER", "ticket-nepal")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "ticket-nepal-web")
JWT_TTL_SECONDS = int(os.getenv("JWT_TTL_SECONDS", "86400"))


def _normalize_role(role: str | None) -> str:
    if not role:
        return "customer"

    value = role.lower().strip()
    if value in {"student", "customer", "user"}:
        return "customer"
    if value in {"vendor", "admin"}:
        return "vendor"
    return "customer"


def _public_user(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "email_verified": bool(user.email_verified),
    }


def _public_user_from_row(user_row: dict) -> dict:
    return {
        "user_id": user_row.get("user_id"),
        "name": user_row.get("name"),
        "email": user_row.get("email"),
        "phone": user_row.get("phone"),
        "role": user_row.get("role"),
        "email_verified": bool(user_row.get("email_verified")),
    }


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(value: str) -> bytes:
    padding = "=" * ((4 - (len(value) % 4)) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def _jwt_b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _jwt_b64_decode(value: str) -> bytes:
    padding = "=" * ((4 - (len(value) % 4)) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def _sign_jwt(header: dict, payload: dict) -> str:
    header_b64 = _jwt_b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _jwt_b64_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_jwt_b64_encode(signature)}"


def _decode_jwt(token: str) -> tuple[dict | None, str | None]:
    parts = (token or "").split(".")
    if len(parts) != 3:
        return None, "invalid"

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_signature = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()

    try:
        header = json.loads(_jwt_b64_decode(header_b64).decode("utf-8"))
        payload = json.loads(_jwt_b64_decode(payload_b64).decode("utf-8"))
        signature = _jwt_b64_decode(signature_b64)
    except Exception:
        return None, "invalid"

    if header.get("alg") != "HS256" or header.get("typ") != "JWT":
        return None, "invalid"

    if not hmac.compare_digest(expected_signature, signature):
        return None, "invalid"

    if payload.get("iss") != JWT_ISSUER or payload.get("aud") != JWT_AUDIENCE:
        return None, "invalid"

    now_ts = int(datetime.now(timezone.utc).timestamp())
    issued_at = int(payload.get("iat", 0) or 0)
    expires_at = int(payload.get("exp", 0) or 0)
    if issued_at <= 0 or expires_at <= 0 or expires_at < now_ts:
        return None, "expired"

    return payload, None


def issue_auth_token(user: dict | User) -> str:
    user_data = _public_user(user) if isinstance(user, User) else _public_user_from_row(user)
    now_ts = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "sub": str(user_data["user_id"]),
        "user_id": user_data["user_id"],
        "name": user_data["name"],
        "email": user_data["email"],
        "role": user_data["role"],
        "email_verified": bool(user_data["email_verified"]),
        "iat": now_ts,
        "exp": now_ts + JWT_TTL_SECONDS,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "typ": "access",
    }
    return _sign_jwt({"alg": "HS256", "typ": "JWT"}, payload)


def get_user_from_auth_token(token: str):
    payload, error = _decode_jwt(token)
    if error:
        return None, error

    user_id = payload.get("user_id") or payload.get("sub")
    if not user_id:
        return None, "invalid"

    with get_session() as db:
        user = db.execute(select(User).where(User.user_id == int(user_id))).scalar_one_or_none()
        if user is None:
            return None, "user"
        if user.is_active is False:
            return None, "inactive"
        return _public_user(user), None


def _verification_token(email: str) -> str:
    payload = {
        "email": email.lower().strip(),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64_encode(payload_bytes)

    digest = hmac.new(
        EMAIL_VERIFY_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload_b64}.{digest}"


def _decode_verification_token(token: str) -> tuple[dict | None, str | None]:
    parts = (token or "").split(".")
    if len(parts) != 2:
        return None, "invalid"

    payload_b64, signature = parts
    expected = hmac.new(
        EMAIL_VERIFY_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return None, "invalid"

    try:
        payload_raw = _b64_decode(payload_b64).decode("utf-8")
        payload = json.loads(payload_raw)
    except Exception:
        return None, "invalid"

    issued_at = int(payload.get("iat", 0))
    now_ts = int(datetime.now(timezone.utc).timestamp())
    if issued_at <= 0 or (now_ts - issued_at) > EMAIL_VERIFY_TTL_SECONDS:
        return None, "expired"

    email = str(payload.get("email", "")).strip().lower()
    if not email:
        return None, "invalid"

    return payload, None


def _verification_email_html(name: str, verify_url: str) -> str:
    return f"""
    <html>
      <body style=\"font-family: Arial, sans-serif; color: #1f2937;\">
        <h2>Verify your Ticket Nepal email</h2>
        <p>Hi {name},</p>
        <p>Thanks for signing up. Please verify your email to activate login.</p>
        <p>
          <a href=\"{verify_url}\" style=\"display:inline-block;padding:10px 16px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;\">Verify Email</a>
        </p>
        <p>If the button does not work, copy this link in your browser:</p>
        <p>{verify_url}</p>
        <p>This link expires in 24 hours.</p>
      </body>
    </html>
    """


def _send_verification_email(user: User) -> bool:
    token = _verification_token(user.email)
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    return send_email(
        recipient=user.email,
        subject="Verify your Ticket Nepal account",
        html_content=_verification_email_html(user.name, verify_url),
    )


def _save_vendor_document_file(document_file) -> tuple[str | None, str | None]:
    filename = (getattr(document_file, "filename", "") or "").strip()
    if not filename:
        return None, "Company registration document is required"

    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_VENDOR_DOC_EXTENSIONS:
        return None, "Document must be PDF, PNG, JPG, or JPEG"

    content = document_file.file.read(MAX_VENDOR_DOC_BYTES + 1)
    if not content:
        return None, "Uploaded document is empty"
    if len(content) > MAX_VENDOR_DOC_BYTES:
        return None, "Document size must be 5MB or less"

    VENDOR_DOC_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"vendor_doc_{uuid4().hex}{extension}"
    target_path = VENDOR_DOC_UPLOAD_DIR / stored_name
    target_path.write_bytes(content)

    return f"vendor_docs/{stored_name}", None


def register_user(name: str, email: str, password: str, role: str | None = None):
    with get_session() as db:
        existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing is not None:
            return None

        normalized_role = _normalize_role(role)
        # Vendor accounts are created in pending state and require superadmin verification.
        is_active = normalized_role != "vendor"

        new_user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=normalized_role,
            auth_provider="local",
            firebase_uid=None,
            email_verified=False,
            is_active=is_active,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        _send_verification_email(new_user)
        return _public_user(new_user)


def register_vendor_with_document(name: str, email: str, password: str, document_file):
    document_path, error = _save_vendor_document_file(document_file)
    if error:
        return None, error

    with get_session() as db:
        try:
            existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if existing is not None:
                stored_full_path = Path(__file__).resolve().parents[2] / "uploads" / str(document_path)
                if stored_full_path.exists():
                    stored_full_path.unlink()
                return None, "Email already used"

            new_vendor = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="vendor",
                auth_provider="local",
                firebase_uid=None,
                email_verified=False,
                is_active=False,
            )
            db.add(new_vendor)
            db.flush()

            # vendors table is the canonical parent for vendor_documents in the current DB schema.
            reg_number = f"PENDING-{new_vendor.user_id}-{uuid4().hex[:8].upper()}"
            vendor_row = db.execute(
                text(
                    """
                    INSERT INTO vendors (
                        user_id,
                        company_name,
                        registration_number,
                        contact_person,
                        contact_email,
                        is_verified,
                        created_at,
                        updated_at
                    ) VALUES (
                        :user_id,
                        :company_name,
                        :registration_number,
                        :contact_person,
                        :contact_email,
                        :is_verified,
                        :created_at,
                        :updated_at
                    )
                    RETURNING vendor_id
                    """
                ),
                {
                    "user_id": new_vendor.user_id,
                    "company_name": name,
                    "registration_number": reg_number,
                    "contact_person": name,
                    "contact_email": email,
                    "is_verified": False,
                    "created_at": datetime.now(timezone.utc).replace(tzinfo=None),
                    "updated_at": datetime.now(timezone.utc).replace(tzinfo=None),
                },
            ).scalar_one()

            vendor_document = VendorDocument(
                vendor_id=int(vendor_row),
                document_type="company_registration",
                document_url=document_path,
                is_verified=False,
                uploaded_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            db.add(vendor_document)
            db.commit()
            db.refresh(new_vendor)
            _send_verification_email(new_vendor)
            return _public_user(new_vendor), None
        except IntegrityError:
            db.rollback()
            stored_full_path = Path(__file__).resolve().parents[2] / "uploads" / str(document_path)
            if stored_full_path.exists():
                stored_full_path.unlink()
            return None, "Vendor registration failed due to data constraint. Please retry with unique details."
        except Exception:
            db.rollback()
            stored_full_path = Path(__file__).resolve().parents[2] / "uploads" / str(document_path)
            if stored_full_path.exists():
                stored_full_path.unlink()
            return None, "Vendor registration failed. Please try again."


def login_user(email: str, password: str):
    with get_session() as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None or not verify_password(password, user.password_hash):
            return None, "invalid"

        # Lazy migration for legacy plain-text passwords.
        if user.password_hash and not is_password_hash(user.password_hash):
            user.password_hash = hash_password(password)
            db.commit()

        if user.email_verified is False:
            return None, "email_unverified"
        if user.is_active is False:
            return None, "inactive"
        return _public_user(user), None


def verify_user_email(token: str):
    payload, error = _decode_verification_token(token)
    if error:
        return None, error

    with get_session() as db:
        email = str(payload.get("email", "")).strip().lower()
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None:
            return None, "user"

        user.email_verified = True
        if user.role in {"student", "customer", "user"} and user.is_active is False:
            user.is_active = True

        db.commit()
        db.refresh(user)
        return _public_user(user), None


def resend_email_verification(email: str) -> bool:
    with get_session() as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None:
            return False
        if user.email_verified:
            return True
        if user.auth_provider and user.auth_provider.startswith("firebase"):
            return True
        return _send_verification_email(user)


def request_password_reset(email: str):
    with get_session() as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        return user is not None


def reset_password(email: str, new_password: str):
    with get_session() as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None:
            return False

        user.password_hash = hash_password(new_password)
        db.commit()
        return True


def _normalize_auth_provider(provider: str | None) -> str:
    value = (provider or "").strip().lower()
    if value in {"google.com", "google"}:
        return "google"
    if value in {"password", "email"}:
        return "firebase_password"
    return "firebase"


def login_or_create_firebase_user(
    firebase_uid: str,
    email: str,
    name: str | None,
    auth_provider: str | None = None,
):
    provider_name = _normalize_auth_provider(auth_provider)

    with get_session() as db:
        user = db.execute(select(User).where(User.firebase_uid == firebase_uid)).scalar_one_or_none()
        if user is None and email:
            user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()

        if user is None:
            user = User(
                name=(name or DEFAULT_FIREBASE_USER_NAME).strip() or DEFAULT_FIREBASE_USER_NAME,
                email=email,
                password_hash=None,
                role="customer",
                auth_provider=provider_name,
                firebase_uid=firebase_uid,
                email_verified=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return _public_user(user)

        user.name = user.name or (name or DEFAULT_FIREBASE_USER_NAME)
        if email and not user.email:
            user.email = email
        user.auth_provider = provider_name
        user.firebase_uid = firebase_uid
        user.email_verified = True
        if user.role in {"student", "user"}:
            user.role = "customer"
        if user.is_active is False:
            user.is_active = True

        db.commit()
        db.refresh(user)
        return _public_user(user)
