import base64
import hashlib
import hmac
import os


AUTH_HASH_SCHEME = "pbkdf2_sha256"
AUTH_HASH_ITERATIONS = int(
    os.getenv("AUTH_HASH_ITERATIONS", os.getenv("PASSWORD_HASH_ITERATIONS", "390000"))
)
AUTH_HASH_SALT_BYTES = int(
    os.getenv("AUTH_HASH_SALT_BYTES", os.getenv("PASSWORD_HASH_SALT_BYTES", "16"))
)


def _b64_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64_decode(value: str) -> bytes:
    padding = "=" * ((4 - (len(value) % 4)) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def is_password_hash(value: str | None) -> bool:
    if not value:
        return False
    parts = value.split("$")
    return len(parts) == 4 and parts[0] == AUTH_HASH_SCHEME


def hash_password(password: str) -> str:
    if password is None:
        raise ValueError("Password cannot be None")

    salt = os.urandom(AUTH_HASH_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        AUTH_HASH_ITERATIONS,
    )
    return (
        f"{AUTH_HASH_SCHEME}"
        f"${AUTH_HASH_ITERATIONS}"
        f"${_b64_encode(salt)}"
        f"${_b64_encode(digest)}"
    )


def verify_password(password: str, stored_value: str | None) -> bool:
    if stored_value is None:
        return False

    if not is_password_hash(stored_value):
        # Backward compatibility for existing rows that still have plain-text values.
        return hmac.compare_digest(stored_value, password)

    parts = stored_value.split("$")
    if len(parts) != 4:
        return False

    _, iterations_str, salt_b64, digest_b64 = parts
    try:
        iterations = int(iterations_str)
        salt = _b64_decode(salt_b64)
        expected_digest = _b64_decode(digest_b64)
    except (TypeError, ValueError):
        return False

    actual_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual_digest, expected_digest)