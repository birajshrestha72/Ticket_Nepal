from typing import Annotated

from fastapi import APIRouter, Body, HTTPException
from fastapi.responses import RedirectResponse
import os

from app.api.response import API
from app.model.schemas import (
    PaymentOrderCreateInput,
    PaymentOrderInitiateInput,
    PaymentOrderKhaltiVerifyInput,
    RefundSimulationInput,
)
from app.services.payment_order_service import (
    create_payment_order,
    initiate_esewa_for_order,
    initiate_khalti_for_order,
    simulate_refund,
    verify_khalti_by_pidx_and_create_booking,
    verify_esewa_and_create_booking,
    verify_khalti_and_create_booking,
)
from app.services.khalti_demo_service import initiate_khalti_demo, verify_khalti_demo

router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
DETAIL_PAYMENT_ORDER_NOT_FOUND = "Payment order not found"
DETAIL_KHALTI_NETWORK = "Unable to connect to Khalti"


def _raise_khalti_demo_initiate_error(error_key: str):
    if error_key == "config":
        raise HTTPException(status_code=503, detail="Khalti API key missing")
    if error_key == "network":
        raise HTTPException(status_code=502, detail=DETAIL_KHALTI_NETWORK)
    if error_key == "gateway_http":
        raise HTTPException(status_code=500, detail="Khalti initiate API returned non-200 response")
    if error_key in {"invalid_json", "invalid_response"}:
        raise HTTPException(status_code=500, detail="Invalid response from Khalti initiate API")
    raise HTTPException(status_code=500, detail=f"Khalti initiate failed: {error_key}")


def _raise_khalti_order_initiate_error(error_key: str):
    if error_key == "config":
        raise HTTPException(status_code=503, detail="Khalti configuration missing")
    if error_key == "order":
        raise HTTPException(status_code=404, detail=DETAIL_PAYMENT_ORDER_NOT_FOUND)
    if error_key == "status":
        raise HTTPException(status_code=400, detail="Order cannot be initiated in current status")
    if error_key == "expired":
        raise HTTPException(status_code=400, detail="Order expired. Please create a new order")
    if error_key == "auth":
        raise HTTPException(status_code=503, detail="Khalti API key is invalid or unauthorized")
    if error_key == "invalid_request":
        raise HTTPException(status_code=400, detail="Invalid Khalti initiate payload")
    if error_key == "gateway":
        raise HTTPException(status_code=502, detail="Khalti initiation failed")
    if error_key == "network":
        raise HTTPException(status_code=502, detail=DETAIL_KHALTI_NETWORK)
    if error_key == "invalid_response":
        raise HTTPException(status_code=502, detail="Invalid Khalti response")
    raise HTTPException(status_code=502, detail=f"Khalti initiation failed: {error_key}")


def _raise_khalti_demo_verify_error(error_key: str):
    if error_key == "pidx":
        raise HTTPException(status_code=400, detail="Khalti pidx is required")
    if error_key == "config":
        raise HTTPException(status_code=503, detail="Khalti API key missing")
    if error_key == "network":
        raise HTTPException(status_code=502, detail=DETAIL_KHALTI_NETWORK)
    if error_key == "gateway_http":
        raise HTTPException(status_code=500, detail="Khalti lookup API returned non-200 response")
    if error_key in {"invalid_json", "invalid_response"}:
        raise HTTPException(status_code=500, detail="Invalid response from Khalti lookup API")
    raise HTTPException(status_code=500, detail=f"Khalti verify failed: {error_key}")


def _raise_khalti_order_verify_error(error_key: str):
    if error_key in {"pidx", "status", "expired", "failed", "not_complete", "amount", "trip", "seat_layout", "seat_invalid", "seat_inactive", "seat_blocked", "seat_booked"}:
        raise HTTPException(status_code=400, detail=f"Khalti verification failed: {error_key}")
    if error_key in {"gateway", "network", "invalid_response"}:
        raise HTTPException(status_code=502, detail=f"Khalti verification failed: {error_key}")
    if error_key == "auth":
        raise HTTPException(status_code=503, detail="Khalti API key is invalid or unauthorized")
    if error_key == "invalid_request":
        raise HTTPException(status_code=400, detail="Invalid Khalti verify payload")
    raise HTTPException(status_code=502, detail=f"Khalti verification failed: {error_key}")


@router.post(
    "/create-order",
    summary="Create payment order",
    responses={
        400: {"description": "Invalid date, amount, or seat selection"},
        404: {"description": "Trip or bus not found"},
        409: {"description": "Seat already booked"},
    },
)
def create_order(payload: PaymentOrderCreateInput):
    order, error_key = create_payment_order(
        user_id=payload.user_id,
        trip_id=payload.trip_id,
        journey_date=str(payload.journey_date),
        seat_labels=payload.seat_labels,
        amount=payload.amount,
    )

    if error_key == "date":
        raise HTTPException(status_code=400, detail="Invalid journey date")
    if error_key == "trip":
        raise HTTPException(status_code=404, detail="Trip not found")
    if error_key == "bus":
        raise HTTPException(status_code=404, detail="Bus not found")
    if error_key == "seats":
        raise HTTPException(status_code=400, detail="Please select at least one seat")
    if error_key == "amount":
        raise HTTPException(status_code=400, detail="Submitted amount does not match server amount")
    if error_key == "seat_layout":
        raise HTTPException(status_code=400, detail="Seat layout not configured")
    if error_key == "seat_invalid":
        raise HTTPException(status_code=400, detail="One or more seats are invalid")
    if error_key == "seat_inactive":
        raise HTTPException(status_code=400, detail="One or more seats are inactive")
    if error_key == "seat_blocked":
        raise HTTPException(status_code=400, detail="One or more seats are blocked")
    if error_key == "seat_booked":
        raise HTTPException(status_code=409, detail="One or more seats are already booked")

    return API.success_with_data("Payment order created", "order", order)


@router.post(
    "/khalti/initiate",
    summary="Initiate Khalti checkout",
    responses={
        400: {"description": "Invalid order status or expired order"},
        404: {"description": "Order not found"},
        502: {"description": "Gateway/network response error"},
        503: {"description": "Khalti not configured"},
        500: {"description": "Khalti API rejected request or returned invalid response"},
    },
)
def initiate_khalti(payload: Annotated[PaymentOrderInitiateInput | None, Body()] = None):
    # Demo fallback: if body is missing, call Khalti sandbox initiate directly.
    if payload is None:
        demo, demo_err = initiate_khalti_demo(amount_paisa=1000)
        if demo_err:
            _raise_khalti_demo_initiate_error(demo_err)
        return demo

    payment, error_key = initiate_khalti_for_order(
        order_id=payload.order_id,
        user_id=payload.user_id,
    )

    if error_key:
        _raise_khalti_order_initiate_error(error_key)

    return API.success_with_data("Khalti initiated", "payment", payment)


@router.post(
    "/khalti/verify",
    summary="Verify Khalti payment by pidx and finalize booking",
    responses={
        400: {"description": "Invalid or incomplete payment"},
        404: {"description": "Payment order not found"},
        502: {"description": "Khalti verification failed"},
        503: {"description": "Khalti service is not configured"},
        500: {"description": "Khalti lookup API rejected request or returned invalid response"},
    },
)
def verify_khalti_post(payload: PaymentOrderKhaltiVerifyInput):
    result, error_key = verify_khalti_by_pidx_and_create_booking(pidx=payload.pidx)

    if error_key == "config":
        raise HTTPException(status_code=503, detail="Khalti configuration missing")
    if error_key == "order":
        demo_result, demo_err = verify_khalti_demo(payload.pidx)
        if demo_err:
            _raise_khalti_demo_verify_error(demo_err)
        return demo_result
    if error_key:
        _raise_khalti_order_verify_error(error_key)

    return API.success_with_data("Khalti payment verified", "payment", result)


@router.post(
    "/esewa/initiate",
    summary="Initiate eSewa checkout",
    responses={
        400: {"description": "Invalid order status or expired order"},
        404: {"description": "Order not found"},
        502: {"description": "Gateway/network response error"},
        503: {"description": "eSewa not configured"},
    },
)
def initiate_esewa(payload: PaymentOrderInitiateInput):
    payment, error_key = initiate_esewa_for_order(
        order_id=payload.order_id,
        user_id=payload.user_id,
    )

    if error_key == "config":
        raise HTTPException(status_code=503, detail="eSewa configuration missing")
    if error_key == "order":
        raise HTTPException(status_code=404, detail=DETAIL_PAYMENT_ORDER_NOT_FOUND)
    if error_key == "status":
        raise HTTPException(status_code=400, detail="Order cannot be initiated in current status")
    if error_key == "expired":
        raise HTTPException(status_code=400, detail="Order expired. Please create a new order")
    if error_key == "gateway":
        raise HTTPException(status_code=502, detail="eSewa initiation failed")
    if error_key == "network":
        raise HTTPException(status_code=502, detail="Unable to connect to eSewa")
    if error_key == "invalid_response":
        raise HTTPException(status_code=502, detail="Invalid eSewa response")
    if error_key:
        raise HTTPException(status_code=502, detail=f"eSewa initiation failed: {error_key}")

    return API.success_with_data("eSewa initiated", "payment", payment)


@router.get("/khalti/verify", summary="Verify Khalti payment and finalize booking")
def verify_khalti(order_id: int, pidx: str | None = None, mock_status: str | None = None):
    result, error_key = verify_khalti_and_create_booking(order_id=order_id, pidx=pidx, mock_status=mock_status)

    if error_key:
        failure_url = f"{FRONTEND_URL}/booking/callback?status=failure&order_id={order_id}&reason={error_key}"
        return RedirectResponse(url=failure_url, status_code=303)

    success_url = (
        f"{FRONTEND_URL}/booking/callback?status=success&order_id={result['order_id']}"
        f"&booking_id={result['booking_id']}&booking_reference={result['booking_reference']}"
    )
    return RedirectResponse(url=success_url, status_code=303)


@router.get("/esewa/verify/{order_id}", summary="Verify eSewa payment and finalize booking")
def verify_esewa(order_id: int, data: str | None = None, status: str | None = None):
    result, error_key = verify_esewa_and_create_booking(order_id=order_id, data=data, status=status)

    if error_key:
        failure_url = f"{FRONTEND_URL}/booking/callback?status=failure&order_id={order_id}&reason={error_key}"
        return RedirectResponse(url=failure_url, status_code=303)

    success_url = (
        f"{FRONTEND_URL}/booking/callback?status=success&order_id={result['order_id']}"
        f"&booking_id={result['booking_id']}&booking_reference={result['booking_reference']}"
    )
    return RedirectResponse(url=success_url, status_code=303)


@router.get("/esewa/verify", summary="Legacy verify eSewa payment and finalize booking")
def verify_esewa_legacy(order_id: int, data: str | None = None, status: str | None = None):
    return verify_esewa(order_id=order_id, data=data, status=status)


@router.post(
    "/refund-simulate",
    summary="Simulate refund without gateway API",
    responses={
        400: {"description": "Order is not paid"},
        404: {"description": "Order not found"},
    },
)
def refund_simulate(payload: RefundSimulationInput):
    result, error_key = simulate_refund(
        order_id=payload.order_id,
        user_id=payload.user_id,
        reason=payload.reason,
    )

    if error_key == "order":
        raise HTTPException(status_code=404, detail="Order not found")
    if error_key == "status":
        raise HTTPException(status_code=400, detail="Only paid orders can be refund-simulated")

    return API.success_with_data("Refund simulation completed", "refund", result)
