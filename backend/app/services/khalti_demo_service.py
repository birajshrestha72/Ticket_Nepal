import logging
import os
import uuid

import requests
from requests import RequestException

logger = logging.getLogger(__name__)

KHALTI_INITIATE_URL = "https://dev.khalti.com/api/v2/epayment/initiate/"
KHALTI_LOOKUP_URL = "https://dev.khalti.com/api/v2/epayment/lookup/"
KHALTI_SECRET_KEY = os.getenv("KHALTI_SECRET_KEY", "").strip()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _headers() -> dict:
    return {
        "Authorization": f"Key {KHALTI_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def initiate_khalti_demo(amount_paisa: int = 1000):
    if not KHALTI_SECRET_KEY:
        return None, "config"

    payload = {
        "return_url": f"{FRONTEND_URL}/khalti-success",
        "website_url": FRONTEND_URL,
        "amount": int(amount_paisa),
        "purchase_order_id": str(uuid.uuid4()),
        "purchase_order_name": "Ticket Booking",
        "customer_info": {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "9800000000",
        },
    }

    try:
        response = requests.post(KHALTI_INITIATE_URL, json=payload, headers=_headers(), timeout=20)
        logger.info("Khalti initiate status=%s body=%s", response.status_code, response.text)
    except RequestException:
        logger.exception("Khalti initiate request failed")
        return None, "network"

    if response.status_code != 200:
        return None, "gateway_http"

    try:
        data = response.json()
    except ValueError:
        return None, "invalid_json"

    payment_url = data.get("payment_url")
    pidx = data.get("pidx")
    if not payment_url or not pidx:
        return None, "invalid_response"

    return {
        "payment_url": payment_url,
        "pidx": pidx,
    }, None


def verify_khalti_demo(pidx: str):
    pidx_value = str(pidx or "").strip()
    if not pidx_value:
        return None, "pidx"

    if pidx_value.startswith("MOCK"):
        return {
            "status": "Completed",
            "pidx": pidx_value,
            "source": "mock",
            "success": True,
        }, None

    if not KHALTI_SECRET_KEY:
        return None, "config"

    try:
        response = requests.post(
            KHALTI_LOOKUP_URL,
            json={"pidx": pidx_value},
            headers=_headers(),
            timeout=20,
        )
        logger.info("Khalti lookup status=%s body=%s", response.status_code, response.text)
    except RequestException:
        logger.exception("Khalti lookup request failed")
        return None, "network"

    if response.status_code != 200:
        return None, "gateway_http"

    try:
        data = response.json()
    except ValueError:
        return None, "invalid_json"

    status = str(data.get("status") or "")
    return {
        "status": status,
        "pidx": pidx_value,
        "source": "lookup",
        "success": status == "Completed",
        "lookup": data,
    }, None
