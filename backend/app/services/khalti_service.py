import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Booking


def _khalti_config() -> tuple[str, str] | tuple[None, None]:
    base_url = os.getenv("KHALTI_VERIFY_BASE_URL", "https://dev.khalti.com/api/v2").rstrip("/")
    secret_key = os.getenv("KHALTI_SECRET_KEY", "").strip()

    if not secret_key:
        return None, None

    return base_url, secret_key


def _fetch_lookup_payload(url: str, pidx: str, secret_key: str) -> tuple[dict | None, str | None]:
    request = Request(
        url,
        method="POST",
        headers={
            "Authorization": f"Key {secret_key}",
            "Content-Type": "application/json",
        },
        data=json.dumps({"pidx": pidx}).encode("utf-8"),
    )

    try:
        with urlopen(request, timeout=15) as response:
            raw_body = response.read().decode("utf-8")
    except HTTPError:
        return None, "verification_failed"
    except URLError:
        return None, "network"
    except Exception:
        return None, "verification_failed"

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return None, "invalid_response"

    if not isinstance(payload, dict):
        return None, "invalid_response"

    return payload, None


def _verification_from_payload(
    payload: dict,
    fallback_pidx: str,
    amount: float | None,
    purchase_order_id: str | None,
) -> tuple[dict, str | None]:
    status = str(payload.get("status", "")).lower()
    response_pidx = str(payload.get("pidx") or fallback_pidx)

    verification = {
        "status": status,
        "pidx": response_pidx,
        "transaction_id": payload.get("transaction_id"),
        "total_amount": payload.get("total_amount"),
        "purchase_order_id": payload.get("purchase_order_id"),
        "purchase_order_name": payload.get("purchase_order_name"),
        "raw": payload,
    }

    if purchase_order_id:
        returned = str(payload.get("purchase_order_id") or "").strip()
        if returned and returned != str(purchase_order_id).strip():
            return verification, "verification_failed"

    if amount is not None:
        returned_amount = payload.get("total_amount")
        if isinstance(returned_amount, (int, float)):
            # Khalti total_amount is often in paisa. Accept either exact or x100 match.
            expected = float(amount)
            if returned_amount not in {expected, expected * 100}:
                return verification, "verification_failed"

    if status != "completed":
        return verification, "not_complete"

    return verification, None


def verify_khalti_transaction(
    pidx: str,
    amount: float | None = None,
    purchase_order_id: str | None = None,
) -> tuple[dict | None, str | None]:
    base_url, secret_key = _khalti_config()
    if not base_url or not secret_key:
        return None, "config"

    cleaned_pidx = (pidx or "").strip()
    if not cleaned_pidx:
        return None, "pidx_required"

    url = f"{base_url}/epayment/lookup/"
    payload, fetch_error = _fetch_lookup_payload(url, cleaned_pidx, secret_key)
    if fetch_error:
        return None, fetch_error

    return _verification_from_payload(payload, cleaned_pidx, amount, purchase_order_id)


def initiate_khalti_payment(
    booking_id: int,
    user_id: int,
    amount: float,
    purchase_order_id: str,
    success_url: str,
    failure_url: str,
    cancel_url: str,
) -> tuple[dict | None, str | None]:
    """Initiate Khalti payment and return redirect URL to Khalti payment portal."""
    base_url, secret_key = _khalti_config()
    if not base_url or not secret_key:
        return None, "config"

    if not amount or amount <= 0:
        return None, "amount_required"
    if not purchase_order_id:
        return None, "purchase_order_id_required"

    # Verify booking exists and user has access
    with get_session() as db:
        booking = db.execute(
            select(Booking).where(Booking.booking_id == booking_id, Booking.user_id == user_id)
        ).scalar_one_or_none()
        if booking is None:
            return None, "booking" if user_id else "forbidden"

    # Khalti payment initialization endpoint
    khalti_initiate_url = f"{base_url}/epayment/initiate/"

    # Build initiation payload
    initiation_payload = {
        "return_url": success_url,
        "website_url": os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "amount": int(round(float(amount) * 100)),  # Khalti expects amount in paisa
        "purchase_order_id": str(purchase_order_id),
        "purchase_order_name": f"Bus Booking {purchase_order_id}",
        "customer_first_name": "",
        "customer_last_name": "",
        "customer_email": "",
        "customer_phone": "",
    }

    # Make initiation request to Khalti
    request_obj = Request(
        khalti_initiate_url,
        method="POST",
        headers={
            "Authorization": f"Key {secret_key}",
            "Content-Type": "application/json",
        },
        data=json.dumps(initiation_payload).encode("utf-8"),
    )

    try:
        with urlopen(request_obj, timeout=15) as response:
            response_body = response.read().decode("utf-8")
        response_data = json.loads(response_body)
    except HTTPError:
        return None, "verification_failed"
    except URLError:
        return None, "network"
    except Exception:
        return None, "verification_failed"

    # Extract payment URL from Khalti response
    payment_url = response_data.get("payment_url")
    pidx = response_data.get("pidx")

    if not payment_url or not pidx:
        return None, "invalid_response"

    payment_request = {
        "payment_gateway": "khalti",
        "booking_id": booking_id,
        "amount": round(float(amount), 2),
        "purchase_order_id": purchase_order_id,
        "pidx": pidx,
        "redirect_url": payment_url,
        "success_url": success_url,
        "failure_url": failure_url,
        "cancel_url": cancel_url,
    }

    return payment_request, None
