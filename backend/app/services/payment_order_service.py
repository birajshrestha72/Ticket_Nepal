import json
import os
import base64
import binascii
import hashlib
import hmac
import logging
from datetime import date, datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
import requests
from requests import RequestException

from sqlalchemy import select

from app.config.database import get_session
from app.model.models import Booking, Bus, BusSchedule
from app.model.payment_order import PaymentOrder
from app.services.booking_service import confirm_booking_payment, create_booking

PAYMENT_ORDER_TTL_MINUTES = int(os.getenv("PAYMENT_ORDER_TTL_MINUTES", "20"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
KHALTI_BASE_URL = os.getenv("KHALTI_VERIFY_BASE_URL", "https://dev.khalti.com/api/v2").rstrip("/")
KHALTI_SECRET_KEY = os.getenv("KHALTI_SECRET_KEY", "").strip()
ESEWA_MERCHANT_ID = os.getenv("ESEWA_MERCHANT_ID", "EPAYTEST").strip()
ESEWA_MERCHANT_SECRET = os.getenv("ESEWA_MERCHANT_SECRET", "").strip()
ESEWA_EPAY_BASE_URL = os.getenv("ESEWA_EPAY_BASE_URL", "https://rc-epay.esewa.com.np").rstrip("/")
ESEWA_EPAY_FORM_URL = os.getenv("ESEWA_EPAY_FORM_URL", f"{ESEWA_EPAY_BASE_URL}/api/epay/main/v2/form").strip()
ESEWA_STATUS_CHECK_BASE_URL = os.getenv("ESEWA_STATUS_CHECK_BASE_URL", "https://rc.esewa.com.np").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
PAYMENT_MOCK_MODE = os.getenv("PAYMENT_MOCK_MODE", "false").strip().lower() in {"1", "true", "yes", "on"}
PAYMENT_MOCK_DEFAULT_STATUS = os.getenv("PAYMENT_MOCK_DEFAULT_STATUS", "success").strip().lower()
logger = logging.getLogger(__name__)


def _now_utc() -> datetime:
    # PaymentOrder timestamps are stored as naive UTC DateTime values.
    # Use naive UTC consistently to avoid aware-vs-naive comparison errors.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _seat_note(seat_labels: list[str]) -> str:
    normalized = [str(label).strip().upper() for label in seat_labels if str(label).strip()]
    unique = []
    seen = set()
    for label in normalized:
        if label in seen:
            continue
        seen.add(label)
        unique.append(label)
    return ",".join(unique)


def _seat_list(seats_text: str) -> list[str]:
    return [item.strip().upper() for item in str(seats_text or "").split(",") if item.strip()]


def _parse_existing_booking_labels(note: str | None) -> list[str]:
    if not note:
        return []
    text = str(note).strip()
    if text.startswith("SEATS:"):
        text = text[6:]
    return [item.strip().upper() for item in text.split(",") if item.strip()]


def _booking_occupancy_active(booking: Booking) -> bool:
    booking_status = (booking.booking_status or "").lower()
    payment_status = (booking.payment_status or "").lower()
    if booking_status == "cancelled":
        return False
    if payment_status in {"paid", "pay_later", "partially_paid", "partially_refunded"}:
        return True
    if booking_status in {"confirmed", "completed", "modified", "pending"}:
        return True
    return False


def _validate_trip_and_amount(db, trip_id: int, seat_labels: list[str], expected_amount: float | None):
    schedule = db.execute(
        select(BusSchedule).where(BusSchedule.schedule_id == trip_id, BusSchedule.is_active.is_(True))
    ).scalar_one_or_none()
    if schedule is None:
        return None, None, "trip"

    bus = db.execute(select(Bus).where(Bus.bus_id == schedule.bus_id, Bus.is_active.is_(True))).scalar_one_or_none()
    if bus is None:
        return None, None, "bus"

    if not seat_labels:
        return None, None, "seats"

    seat_count = len(seat_labels)
    calculated = round(float(schedule.price) * seat_count, 2)
    if expected_amount is not None:
        submitted = round(float(expected_amount), 2)
        if submitted != calculated:
            return None, None, "amount"

    return schedule, calculated, None


def _seat_grid_for_bus(db, bus_id: int) -> dict[str, dict]:
    from app.model.bus import BusSeat

    rows = db.execute(
        select(BusSeat).where(BusSeat.bus_id == bus_id)
    ).scalars().all()
    grid: dict[str, dict] = {}
    for seat in rows:
        label = str(seat.seat_label or "").strip().upper()
        if not label:
            continue
        grid[label] = {
            "is_active": bool(seat.is_active),
            "is_blocked": bool(seat.is_blocked),
        }
    return grid


def _ensure_seats_available(db, bus_id: int, trip_id: int, journey_date: date, seat_labels: list[str]) -> str | None:
    seat_grid = _seat_grid_for_bus(db, bus_id)
    if not seat_grid:
        return "seat_layout"

    for label in seat_labels:
        cfg = seat_grid.get(label)
        if not cfg:
            return "seat_invalid"
        if not cfg["is_active"]:
            return "seat_inactive"
        if cfg["is_blocked"]:
            return "seat_blocked"

    bookings = db.execute(
        select(Booking).where(
            Booking.schedule_id == trip_id,
            Booking.journey_date == journey_date,
        )
    ).scalars().all()

    occupied = set()
    for booking in bookings:
        if not _booking_occupancy_active(booking):
            continue
        occupied.update(_parse_existing_booking_labels(booking.special_requests))

    for label in seat_labels:
        if label in occupied:
            return "seat_booked"

    return None


def _expire_stale_pending_orders(db, user_id: int | None = None):
    now = _now_utc()
    query = select(PaymentOrder).where(
        PaymentOrder.status == "pending",
        PaymentOrder.expires_at.is_not(None),
        PaymentOrder.expires_at < now,
    )
    if user_id is not None:
        query = query.where(PaymentOrder.user_id == user_id)

    stale = db.execute(query).scalars().all()
    for item in stale:
        item.status = "failed"
        item.failure_reason = "expired"
        item.updated_at = now


def create_payment_order(
    user_id: int,
    trip_id: int,
    journey_date: str,
    seat_labels: list[str],
    amount: float,
):
    try:
        parsed_date = date.fromisoformat(str(journey_date))
    except Exception:
        return None, "date"

    seats_text = _seat_note(seat_labels)
    normalized_labels = _seat_list(seats_text)

    with get_session() as db:
        _expire_stale_pending_orders(db, user_id=user_id)

        schedule, calculated_amount, err = _validate_trip_and_amount(db, trip_id, normalized_labels, amount)
        if err:
            return None, err

        seat_err = _ensure_seats_available(db, schedule.bus_id, trip_id, parsed_date, normalized_labels)
        if seat_err:
            return None, seat_err

        now = _now_utc()
        order = PaymentOrder(
            user_id=user_id,
            trip_id=trip_id,
            journey_date=parsed_date,
            seats=seats_text,
            amount=calculated_amount,
            status="pending",
            pidx=None,
            booking_id=None,
            failure_reason=None,
            expires_at=now + timedelta(minutes=PAYMENT_ORDER_TTL_MINUTES),
            created_at=now,
            updated_at=now,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        return {
            "id": order.id,
            "user_id": order.user_id,
            "trip_id": order.trip_id,
            "journey_date": str(order.journey_date),
            "seats": _seat_list(order.seats),
            "amount": float(order.amount),
            "status": order.status,
            "pidx": order.pidx,
            "created_at": order.created_at.isoformat(),
            "expires_at": order.expires_at.isoformat() if order.expires_at else None,
        }, None


def initiate_khalti_for_order(order_id: int, user_id: int):
    if not KHALTI_SECRET_KEY:
        return None, "config"

    try:
        with get_session() as db:
            order = db.execute(
                select(PaymentOrder).where(PaymentOrder.id == order_id, PaymentOrder.user_id == user_id)
            ).scalar_one_or_none()
            if order is None:
                return None, "order"

            if order.status != "pending":
                return None, "status"

            now = _now_utc()
            if order.expires_at and order.expires_at < now:
                order.status = "failed"
                order.failure_reason = "expired"
                order.updated_at = now
                db.commit()
                return None, "expired"

            purchase_order_id = f"TN-ORDER-{order.id}"
            return_url = f"{FRONTEND_URL}/khalti-success?order_id={order.id}"

            payload = {
                "return_url": return_url,
                "website_url": FRONTEND_URL,
                "amount": int(round(float(order.amount) * 100)),
                "purchase_order_id": purchase_order_id,
                "purchase_order_name": f"Ticket Nepal Order {order.id}",
                "customer_info": {
                    "name": "Ticket Nepal Customer",
                    "email": "customer@ticketnepal.local",
                    "phone": "9800000000",
                },
            }

            try:
                response = requests.post(
                    f"{KHALTI_BASE_URL}/epayment/initiate/",
                    headers={
                        "Authorization": f"Key {KHALTI_SECRET_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=20,
                )
                status_code = int(response.status_code)
                response_data = response.json() if response.text else {}
            except RequestException:
                return None, "network"
            except ValueError:
                return None, "invalid_response"

            if status_code in {401, 403}:
                    return None, "auth"
            if status_code == 400:
                    return None, "invalid_request"
            if status_code >= 500:
                return None, "gateway"

            payment_url = response_data.get("payment_url")
            pidx = response_data.get("pidx")
            if not payment_url or not pidx:
                return None, "invalid_response"

            order.pidx = str(pidx)
            order.updated_at = _now_utc()
            db.commit()

            return {
                "order_id": order.id,
                "status": order.status,
                "pidx": order.pidx,
                "payment_url": payment_url,
            }, None
    except Exception:
        logger.exception("Unexpected error during Khalti initiate for order_id=%s user_id=%s", order_id, user_id)
        return None, "gateway"


def _esewa_signature(message: str, secret_key: str) -> str:
    digest = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


def _esewa_signed_message_from_payload(payload: dict) -> str:
    signed_fields = [
        field.strip()
        for field in str(payload.get("signed_field_names") or "").split(",")
        if field.strip()
    ]
    return ",".join(f"{field}={payload.get(field, '')}" for field in signed_fields)


def initiate_esewa_for_order(order_id: int, user_id: int):
    if not ESEWA_MERCHANT_ID or not ESEWA_MERCHANT_SECRET:
        return None, "config"

    try:
        with get_session() as db:
            order = db.execute(
                select(PaymentOrder).where(PaymentOrder.id == order_id, PaymentOrder.user_id == user_id)
            ).scalar_one_or_none()
            if order is None:
                return None, "order"

            if order.status != "pending":
                return None, "status"

            now = _now_utc()
            if order.expires_at and order.expires_at < now:
                order.status = "failed"
                order.failure_reason = "expired"
                order.updated_at = now
                db.commit()
                return None, "expired"

            transaction_uuid = f"TN-{order.id}-{int(now.timestamp())}"
            order.pidx = transaction_uuid
            order.updated_at = now
            db.commit()

            amount = round(float(order.amount), 2)
            amount_str = f"{amount:.2f}"
            signed_field_names = "total_amount,transaction_uuid,product_code"
            message = f"total_amount={amount_str},transaction_uuid={transaction_uuid},product_code={ESEWA_MERCHANT_ID}"
            signature = _esewa_signature(message, ESEWA_MERCHANT_SECRET)

            success_url = f"{BACKEND_URL}/api/payments/esewa/verify/{order.id}"
            failure_url = f"{BACKEND_URL}/api/payments/esewa/verify/{order.id}?status=failure"

            form_fields = {
                "amount": amount_str,
                "tax_amount": "0",
                "total_amount": amount_str,
                "transaction_uuid": transaction_uuid,
                "product_code": ESEWA_MERCHANT_ID,
                "product_service_charge": "0",
                "product_delivery_charge": "0",
                "success_url": success_url,
                "failure_url": failure_url,
                "signed_field_names": signed_field_names,
                "signature": signature,
            }

            return {
                "order_id": order.id,
                "status": order.status,
                "transaction_uuid": transaction_uuid,
                "form_action": ESEWA_EPAY_FORM_URL,
                "form_fields": form_fields,
            }, None
    except Exception:
        logger.exception("Unexpected error during eSewa initiate for order_id=%s user_id=%s", order_id, user_id)
        return None, "gateway"


def _decode_esewa_data(data: str | None):
    if not data:
        return None, "data"

    raw = str(data).strip()
    if not raw:
        return None, "data"

    # Query-string decoding often turns '+' into spaces; normalize before base64 decode.
    normalized = raw.replace(" ", "+")

    for decoder in (
        lambda v: base64.b64decode(v.encode("utf-8")),
        lambda v: base64.urlsafe_b64decode((v + "=" * ((4 - len(v) % 4) % 4)).encode("utf-8")),
    ):
        try:
            decoded = decoder(normalized).decode("utf-8")
            payload = json.loads(decoded)
            if isinstance(payload, dict):
                return payload, None
        except (binascii.Error, UnicodeDecodeError, json.JSONDecodeError):
            continue

    return None, "invalid_response"


def _fetch_esewa_status(transaction_uuid: str, amount: float):
    query = urlencode(
        {
            "product_code": ESEWA_MERCHANT_ID,
            "total_amount": f"{round(float(amount), 2):.2f}",
            "transaction_uuid": transaction_uuid,
        },
        quote_via=quote,
    )
    url = f"{ESEWA_STATUS_CHECK_BASE_URL}/api/epay/transaction/status/?{query}"

    request_obj = Request(url, method="GET")
    try:
        with urlopen(request_obj, timeout=20) as response:
            return json.loads(response.read().decode("utf-8")), None
    except HTTPError:
        return None, "gateway"
    except URLError:
        return None, "network"
    except Exception:
        return None, "gateway"


def _mark_order_failed(db, order: PaymentOrder, failure_reason: str):
    order.status = "failed"
    order.failure_reason = failure_reason
    order.updated_at = _now_utc()
    db.commit()


def _get_paid_order_response(db, order: PaymentOrder):
    if order.status != "paid" or not order.booking_id:
        return None

    existing_booking = db.execute(select(Booking).where(Booking.booking_id == order.booking_id)).scalar_one_or_none()
    if existing_booking is None:
        return None

    return {
        "status": "paid",
        "order_id": order.id,
        "booking_id": existing_booking.booking_id,
        "booking_reference": existing_booking.booking_reference,
    }


def _validate_esewa_payload(db, order: PaymentOrder, transaction_uuid: str, verify_payload: dict):
    message = _esewa_signed_message_from_payload(verify_payload)
    sent_signature = str(verify_payload.get("signature") or "")
    generated_signature = _esewa_signature(message, ESEWA_MERCHANT_SECRET)
    if not sent_signature or not hmac.compare_digest(sent_signature, generated_signature):
        _mark_order_failed(db, order, "signature_mismatch")
        return "signature"

    status_value = str(verify_payload.get("status") or "").upper()
    payload_uuid = str(verify_payload.get("transaction_uuid") or "").strip()
    payload_code = str(verify_payload.get("product_code") or "").strip()
    payload_amount = round(float(verify_payload.get("total_amount") or 0), 2)

    if payload_uuid and payload_uuid != transaction_uuid:
        _mark_order_failed(db, order, "uuid_mismatch")
        return "transaction_uuid"

    if payload_code and payload_code != ESEWA_MERCHANT_ID:
        _mark_order_failed(db, order, "product_code_mismatch")
        return "product_code"

    if payload_amount != round(float(order.amount), 2):
        _mark_order_failed(db, order, "amount_mismatch")
        return "amount"

    if status_value != "COMPLETE":
        _mark_order_failed(db, order, f"esewa_status:{status_value or 'UNKNOWN'}")
        return "not_complete"

    return None


def _verify_esewa_order_completion(db, order: PaymentOrder, transaction_uuid: str, data: str | None):
    if data:
        verify_payload, parse_error = _decode_esewa_data(data)
        if parse_error:
            return parse_error
        return _validate_esewa_payload(db, order, transaction_uuid, verify_payload)

    status_payload, status_err = _fetch_esewa_status(transaction_uuid, float(order.amount))
    if status_err:
        return status_err

    status_value = str(status_payload.get("status") or "").upper()
    if status_value != "COMPLETE":
        _mark_order_failed(db, order, f"esewa_status:{status_value or 'UNKNOWN'}")
        return "not_complete"

    return None


def _validate_esewa_seat_readiness(db, order: PaymentOrder):
    seat_labels = _seat_list(order.seats)
    schedule = db.execute(
        select(BusSchedule).where(BusSchedule.schedule_id == order.trip_id)
    ).scalar_one_or_none()
    if schedule is None:
        _mark_order_failed(db, order, "trip_not_found")
        return None, None, "trip"

    seat_err = _ensure_seats_available(db, schedule.bus_id, order.trip_id, order.journey_date, seat_labels)
    if seat_err:
        _mark_order_failed(db, order, seat_err)
        return None, None, seat_err

    return schedule, seat_labels, None


def _prepare_esewa_order_context(db, order_id: int):
    order = db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id)).scalar_one_or_none()
    if order is None:
        return None, None, None, "order"

    paid_response = _get_paid_order_response(db, order)
    if paid_response is not None:
        return order, None, paid_response, None

    if order.status == "failed":
        return None, None, None, "failed"

    now = _now_utc()
    if order.expires_at and order.expires_at < now:
        _mark_order_failed(db, order, "expired")
        return None, None, None, "expired"

    transaction_uuid = str(order.pidx or "").strip()
    if not transaction_uuid:
        return None, None, None, "transaction_uuid"

    return order, transaction_uuid, None, None


def _create_and_confirm_esewa_booking(order_id: int, user_id: int, bus_id: int, journey_date: date, seat_labels: list[str]):
    booking, booking_err = create_booking(
        user_id=user_id,
        bus_id=bus_id,
        journey_date=str(journey_date),
        seats=len(seat_labels),
        seat_labels=seat_labels,
        payment_method="esewa",
        is_counter_booking=False,
    )
    if booking_err:
        with get_session() as db:
            order = db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id)).scalar_one_or_none()
            if order is not None:
                _mark_order_failed(db, order, f"booking_error:{booking_err}")
        return None, booking_err

    confirmed_booking, payment_err = confirm_booking_payment(
        booking_id=booking["booking_id"],
        user_id=user_id,
        payment_method="esewa",
        pay_later=False,
    )
    if payment_err:
        return None, payment_err

    return confirmed_booking, None


def verify_esewa_and_create_booking(order_id: int, data: str | None = None, status: str | None = None):
    if not ESEWA_MERCHANT_ID or not ESEWA_MERCHANT_SECRET:
        return None, "config"

    if (status or "").strip().lower() == "failure":
        return None, "not_complete"

    with get_session() as db:
        order, transaction_uuid, paid_response, context_err = _prepare_esewa_order_context(db, order_id)
        if paid_response is not None:
            return paid_response, None
        if context_err:
            return None, context_err

        verify_err = _verify_esewa_order_completion(db, order, transaction_uuid, data)
        if verify_err:
            return None, verify_err

        schedule, seat_labels, seat_readiness_err = _validate_esewa_seat_readiness(db, order)
        if seat_readiness_err:
            return None, seat_readiness_err

    confirmed_booking, payment_flow_err = _create_and_confirm_esewa_booking(
        order_id=order_id,
        user_id=order.user_id,
        bus_id=schedule.bus_id,
        journey_date=order.journey_date,
        seat_labels=seat_labels,
    )
    if payment_flow_err:
        return None, payment_flow_err

    with get_session() as db:
        order = db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id)).scalar_one_or_none()
        if order is not None:
            order.status = "paid"
            order.booking_id = confirmed_booking["booking_id"]
            order.failure_reason = None
            order.updated_at = _now_utc()
            db.commit()

    return {
        "status": "paid",
        "order_id": order_id,
        "booking_id": confirmed_booking["booking_id"],
        "booking_reference": confirmed_booking["booking_reference"],
        "esewa": {
            "transaction_uuid": transaction_uuid,
        },
    }, None


def _lookup_khalti(pidx: str):
    try:
        response = requests.post(
            f"{KHALTI_BASE_URL}/epayment/lookup/",
            headers={
                "Authorization": f"Key {KHALTI_SECRET_KEY}",
                "Content-Type": "application/json",
            },
            json={"pidx": pidx},
            timeout=20,
        )
        status_code = int(response.status_code)
        body = response.json() if response.text else {}
    except RequestException:
        return None, "network"
    except ValueError:
        return None, "invalid_response"

    if status_code in {401, 403}:
            return None, "auth"
    if status_code == 400:
            return None, "invalid_request"
    if status_code >= 500:
        return None, "gateway"

    return body, None


def _lookup_khalti_mock(pidx: str, expected_amount: float) -> tuple[dict, None]:
    status = "Completed"
    if "FAIL" in pidx.upper():
        status = "Expired"

    return {
        "status": status,
        "pidx": pidx,
        "transaction_id": f"mock-txn-{int(_now_utc().timestamp())}",
        "total_amount": int(round(float(expected_amount) * 100)),
    }, None


def verify_khalti_by_pidx_and_create_booking(pidx: str):
    try:
        pidx_value = str(pidx or "").strip()
        if not pidx_value:
            return None, "pidx"

        with get_session() as db:
            order = db.execute(select(PaymentOrder).where(PaymentOrder.pidx == pidx_value)).scalar_one_or_none()
            if order is None:
                return None, "order"
            order_id = int(order.id)

        return verify_khalti_and_create_booking(order_id=order_id, pidx=pidx_value)
    except Exception:
        logger.exception("Unexpected error during Khalti verify-by-pidx for pidx=%s", pidx)
        return None, "gateway"


def verify_khalti_and_create_booking(order_id: int, pidx: str | None = None, mock_status: str | None = None):  # NOSONAR - payment verification orchestrator
    if not KHALTI_SECRET_KEY:
        return None, "config"

    with get_session() as db:
        order = db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id)).scalar_one_or_none()
        if order is None:
            return None, "order"

        if order.status == "paid" and order.booking_id:
            existing_booking = db.execute(select(Booking).where(Booking.booking_id == order.booking_id)).scalar_one_or_none()
            if existing_booking is not None:
                return {
                    "status": "paid",
                    "order_id": order.id,
                    "booking_id": existing_booking.booking_id,
                    "booking_reference": existing_booking.booking_reference,
                }, None

        if order.status == "failed":
            return None, "failed"

        now = _now_utc()
        if order.expires_at and order.expires_at < now:
            order.status = "failed"
            order.failure_reason = "expired"
            order.updated_at = now
            db.commit()
            return None, "expired"

        pidx_value = str(pidx or order.pidx or "").strip()
        if not pidx_value:
            return None, "pidx"

        lookup_data, lookup_err = _lookup_khalti(pidx_value)
        if lookup_err:
            return None, lookup_err

        status = str(lookup_data.get("status", "")).lower()
        total_amount = lookup_data.get("total_amount")

        if status != "completed":
            order.status = "failed"
            order.failure_reason = f"khalti_status:{status or 'unknown'}"
            order.updated_at = _now_utc()
            db.commit()
            return None, "not_complete"

        expected_paisa = int(round(float(order.amount) * 100))
        if isinstance(total_amount, (int, float)) and int(total_amount) != expected_paisa:
            order.status = "failed"
            order.failure_reason = "amount_mismatch"
            order.updated_at = _now_utc()
            db.commit()
            return None, "amount"

        seat_labels = _seat_list(order.seats)
        schedule = db.execute(
            select(BusSchedule).where(BusSchedule.schedule_id == order.trip_id)
        ).scalar_one_or_none()
        if schedule is None:
            order.status = "failed"
            order.failure_reason = "trip_not_found"
            order.updated_at = _now_utc()
            db.commit()
            return None, "trip"

        seat_err = _ensure_seats_available(db, schedule.bus_id, order.trip_id, order.journey_date, seat_labels)
        if seat_err:
            order.status = "failed"
            order.failure_reason = seat_err
            order.updated_at = _now_utc()
            db.commit()
            return None, seat_err

    # Create booking only after successful verification (payment-first)
    booking, booking_err = create_booking(
        user_id=order.user_id,
        bus_id=schedule.bus_id,
        journey_date=str(order.journey_date),
        seats=len(seat_labels),
        seat_labels=seat_labels,
        payment_method="khalti",
        is_counter_booking=False,
    )
    if booking_err:
        with get_session() as db:
            order = db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id)).scalar_one_or_none()
            if order is not None:
                order.status = "failed"
                order.failure_reason = f"booking_error:{booking_err}"
                order.updated_at = _now_utc()
                db.commit()
        return None, booking_err

    # Confirm as paid + send email receipt/ticket
    confirmed_booking, payment_err = confirm_booking_payment(
        booking_id=booking["booking_id"],
        user_id=order.user_id,
        payment_method="khalti",
        pay_later=False,
    )
    if payment_err:
        return None, payment_err

    with get_session() as db:
        order = db.execute(select(PaymentOrder).where(PaymentOrder.id == order_id)).scalar_one_or_none()
        if order is not None:
            order.status = "paid"
            order.pidx = pidx_value
            order.booking_id = confirmed_booking["booking_id"]
            order.failure_reason = None
            order.updated_at = _now_utc()
            db.commit()

    return {
        "status": "paid",
        "order_id": order_id,
        "booking_id": confirmed_booking["booking_id"],
        "booking_reference": confirmed_booking["booking_reference"],
        "khalti": {
            "pidx": pidx_value,
            "status": status,
            "transaction_id": lookup_data.get("transaction_id"),
        },
    }, None


def simulate_refund(order_id: int, user_id: int, reason: str | None = None):
    with get_session() as db:
        order = db.execute(
            select(PaymentOrder).where(PaymentOrder.id == order_id, PaymentOrder.user_id == user_id)
        ).scalar_one_or_none()
        if order is None:
            return None, "order"
        if order.status != "paid":
            return None, "status"

        order.status = "failed"
        order.failure_reason = f"refund_simulated:{(reason or 'manual').strip()}"
        order.updated_at = _now_utc()
        db.commit()

        return {
            "order_id": order.id,
            "status": "refund_simulated",
            "amount": float(order.amount),
            "reason": reason or "manual",
        }, None
