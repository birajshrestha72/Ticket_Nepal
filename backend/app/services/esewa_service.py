import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Booking


def _esewa_config() -> tuple[str, str, str] | tuple[None, None, None]:
    base_url = os.getenv("ESEWA_VERIFY_BASE_URL", "https://rc.esewa.com.np").rstrip("/")
    merchant_id = os.getenv("ESEWA_MERCHANT_ID", "").strip()
    merchant_secret = os.getenv("ESEWA_MERCHANT_SECRET", "").strip()

    if not merchant_id or not merchant_secret:
        return None, None, None

    return base_url, merchant_id, merchant_secret


def _build_verify_query(ref_id: str, amount: float | None, product_id: str | None) -> str:
    ref = (ref_id or "").strip()
    if not ref:
        return ""

    params = {"txnRefId": ref}
    if product_id and amount is not None:
        params = {
            "productId": str(product_id).strip(),
            "amount": str(amount),
        }
    return urlencode(params)


def _fetch_verify_payload(url: str, merchant_id: str, merchant_secret: str) -> tuple[dict | list | None, str | None]:
    request = Request(
        url,
        method="GET",
        headers={
            "merchantId": merchant_id,
            "merchantSecret": merchant_secret,
            "Content-Type": "application/json",
        },
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
        return json.loads(raw_body), None
    except json.JSONDecodeError:
        return None, "invalid_response"


def _verification_from_payload(payload, fallback_ref: str) -> tuple[dict | None, str | None]:
    if isinstance(payload, list) and payload:
        data = payload[0]
    elif isinstance(payload, dict):
        data = payload
    else:
        return None, "invalid_response"

    transaction = data.get("transactionDetails") or {}
    status = str(transaction.get("status", "")).upper()

    verification = {
        "status": status,
        "reference_id": transaction.get("referenceId") or fallback_ref,
        "product_id": data.get("productId"),
        "product_name": data.get("productName"),
        "total_amount": data.get("totalAmount"),
        "code": data.get("code"),
        "merchant_name": data.get("merchantName"),
        "message": data.get("message"),
        "raw": data,
    }

    if status != "COMPLETE":
        return verification, "not_complete"
    return verification, None


def verify_esewa_transaction(
    ref_id: str,
    amount: float | None = None,
    product_id: str | None = None,
) -> tuple[dict | None, str | None]:
    base_url, merchant_id, merchant_secret = _esewa_config()
    if not base_url or not merchant_id or not merchant_secret:
        return None, "config"

    query = _build_verify_query(ref_id, amount, product_id)
    if not query:
        return None, "ref_required"

    ref = (ref_id or "").strip()
    url = f"{base_url}/mobile/transaction?{query}"

    payload, fetch_error = _fetch_verify_payload(url, merchant_id, merchant_secret)
    if fetch_error:
        return None, fetch_error

    return _verification_from_payload(payload, ref)


def initiate_esewa_payment(
    booking_id: int,
    user_id: int,
    amount: float,
    product_id: str,
    success_url: str,
    failure_url: str,
    cancel_url: str,
) -> tuple[dict | None, str | None]:
    """Initiate eSewa payment and return redirect URL to eSewa payment portal."""
    base_url, merchant_id, merchant_secret = _esewa_config()
    if not base_url or not merchant_id or not merchant_secret:
        return None, "config"

    if not amount or amount <= 0:
        return None, "amount_required"
    if not product_id:
        return None, "product_id_required"

    # Verify booking exists and user has access
    with get_session() as db:
        booking = db.execute(
            select(Booking).where(Booking.booking_id == booking_id, Booking.user_id == user_id)
        ).scalar_one_or_none()
        if booking is None:
            return None, "booking" if user_id else "forbidden"

    # Build eSewa payment redirect URL
    # eSewa pay endpoint: https://esewa.com.np/epay/main
    esewa_pay_url = f"{base_url}/epay/main"
    params = {
        "amt": str(round(float(amount), 2)),
        "psc": "0",  # service charge
        "pdc": "0",  # delivery charge
        "txAmt": str(round(float(amount), 2)),
        "tAmt": str(round(float(amount), 2)),
        "pid": str(product_id),
        "scd": merchant_id,
        "su": success_url,
        "fu": failure_url,
    }

    redirect_url = f"{esewa_pay_url}?{urlencode(params)}"

    payment_request = {
        "payment_gateway": "esewa",
        "booking_id": booking_id,
        "amount": round(float(amount), 2),
        "product_id": product_id,
        "merchant_id": merchant_id,
        "redirect_url": redirect_url,
        "success_url": success_url,
        "failure_url": failure_url,
        "cancel_url": cancel_url,
    }

    return payment_request, None
