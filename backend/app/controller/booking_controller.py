from fastapi import APIRouter, HTTPException, Response

from app.api.response import API
from app.model.schemas import (
    CancelBookingInput,
    ConfirmBookingPaymentInput,
    CreateBookingInput,
    EsewaVerifyPaymentInput,
    InitiateEsewaPaymentInput,
    InitiateKhaltiPaymentInput,
    KhaltiVerifyPaymentInput,
    ModifyBookingSeatsInput,
    ReplaceBookingSeatsInput,
)
from app.services.booking_service import cancel_booking as cancel_booking_record
from app.services.booking_service import confirm_booking_payment
from app.services.booking_service import create_booking as create_booking_record
from app.services.booking_service import get_booking_ticket_pdf
from app.services.booking_service import get_refund_estimate
from app.services.booking_service import get_seat_availability
from app.services.booking_service import modify_booking_seats
from app.services.booking_service import replace_booking_seats
from app.services.booking_service import (
    list_bookings as list_booking_records,
    list_bookings_by_user,
)
from app.services.esewa_service import initiate_esewa_payment, verify_esewa_transaction
from app.services.khalti_service import initiate_khalti_payment, verify_khalti_transaction

router = APIRouter()

DETAIL_BOOKING_NOT_FOUND = "Booking not found"
DETAIL_BUS_NOT_FOUND = "Bus not found"
DETAIL_CANNOT_UPDATE_BOOKING = "You cannot update this booking"


@router.get(
    "",
    summary="List bookings",
    description="List all bookings or filter by user_id query parameter.",
)
def list_bookings(user_id: int | None = None):
    """List bookings.

    Example queries:
    - /api/bookings
    - /api/bookings?user_id=12
    """
    if user_id is not None:
        return list_bookings_by_user(user_id)
    return list_booking_records()


@router.post(
    "",
    summary="Create booking",
    description="Create booking with selected seats before payment confirmation.",
    responses={
        400: {"description": "Invalid seat selection or booking constraints violated"},
        404: {"description": "User or bus not found"},
    },
)
def create_booking(payload: CreateBookingInput):
    """Create booking.

    Example request body:
    {
        "user_id": 12,
        "bus_id": 4,
        "journey_date": "2026-04-05",
        "seats": 2,
        "seat_labels": ["A1", "A2"],
        "payment_method": "esewa",
        "is_counter_booking": false
    }
    """
    new_booking, error_key = create_booking_record(
        user_id=payload.user_id,
        bus_id=payload.bus_id,
        journey_date=str(payload.journey_date),
        seats=payload.seats,
        seat_labels=payload.seat_labels,
        payment_method=payload.payment_method,
        is_counter_booking=payload.is_counter_booking,
    )
    if error_key == "user":
        raise HTTPException(status_code=404, detail="User not found")
    if error_key == "bus":
        raise HTTPException(status_code=404, detail=DETAIL_BUS_NOT_FOUND)
    if error_key == "seat_count":
        raise HTTPException(status_code=400, detail="Seat labels count must match seats count")
    if error_key == "seat_invalid":
        raise HTTPException(status_code=400, detail="One or more seats are invalid")
    if error_key == "seat_blocked":
        raise HTTPException(status_code=400, detail="One or more seats are currently blocked")
    if error_key == "seat_booked":
        raise HTTPException(status_code=400, detail="One or more seats are already booked")
    if error_key == "seat_limit":
        raise HTTPException(status_code=400, detail="Exceeded maximum seats per booking")

    return API.success_with_data("Booking created", "booking", new_booking)


@router.get(
    "/seat-availability",
    summary="Get seat availability",
    description="Return real-time seat grid with status: available, booked, sold, mine, blocked, or disabled.",
    responses={
        404: {"description": "Bus or schedule not found"},
    },
)
def get_availability(
    bus_id: int,
    journey_date: str,
    booking_id: int | None = None,
    user_id: int | None = None,
):
    """Load seat map.

    Example query:
    /api/bookings/seat-availability?bus_id=4&journey_date=2026-04-05&booking_id=44&user_id=12
    """
    availability, error_key = get_seat_availability(
        bus_id=bus_id,
        journey_date=journey_date,
        booking_id=booking_id,
        user_id=user_id,
    )
    if error_key == "bus":
        raise HTTPException(status_code=404, detail=DETAIL_BUS_NOT_FOUND)
    if error_key == "schedule":
        raise HTTPException(status_code=404, detail="Schedule not found")

    return API.success_with_data("Seat availability loaded", "availability", availability)


@router.get(
    "/{booking_id}/refund-estimate",
    summary="Get refund estimate",
    description="Calculate refund for removing selected seats from an existing booking.",
    responses={
        400: {"description": "Booking state or seat labels are invalid for refund estimate"},
        403: {"description": "Access to this booking is forbidden"},
        404: {"description": "Booking not found"},
    },
)
def refund_estimate(
    booking_id: int,
    user_id: int,
    remove_seat_labels: str | None = None,
):
    """Refund estimate endpoint.

    Example query:
    /api/bookings/44/refund-estimate?user_id=12&remove_seat_labels=A2,A3
    """
    labels = None
    if remove_seat_labels:
        labels = [item.strip().upper() for item in remove_seat_labels.split(",") if item.strip()]

    estimate, error_key = get_refund_estimate(
        booking_id=booking_id,
        user_id=user_id,
        remove_seat_labels=labels,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail="You cannot access this booking")
    if error_key == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    if error_key == "seat_tracking_unavailable":
        raise HTTPException(status_code=400, detail="Seat-level refund estimate not available")
    if error_key == "seat_required":
        raise HTTPException(status_code=400, detail="Please provide seats for estimate")
    if error_key == "seat_not_in_booking":
        raise HTTPException(status_code=400, detail="One or more seats are not in this booking")

    return API.success_with_data("Refund estimate loaded", "estimate", estimate)


@router.patch(
    "/{booking_id}/cancel",
    summary="Cancel booking",
    description="Cancel booking and return refund details according to policy.",
    responses={
        403: {"description": "You cannot cancel this booking"},
        404: {"description": "Booking not found"},
    },
)
def cancel_booking(booking_id: int, payload: CancelBookingInput):
    """Cancel full booking by booking owner."""
    booking, refund, error_key = cancel_booking_record(
        booking_id=booking_id,
        user_id=payload.user_id,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail="You cannot cancel this booking")

    response = API.success_with_data("Booking cancelled", "booking", booking)
    response["refund"] = refund
    return response


@router.patch(
    "/{booking_id}/seats",
    summary="Remove seats from booking",
    description="Remove specific booked seats and compute refund amount.",
    responses={
        400: {"description": "Booking cannot be modified with provided seat labels"},
        403: {"description": "You cannot modify this booking"},
        404: {"description": "Booking not found"},
    },
)
def modify_seats(booking_id: int, payload: ModifyBookingSeatsInput):
    """Partially modify seat list by removing seats only."""
    booking, refund, error_key = modify_booking_seats(
        booking_id=booking_id,
        user_id=payload.user_id,
        remove_seat_labels=payload.remove_seat_labels,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail="You cannot modify this booking")
    if error_key == "cancelled":
        raise HTTPException(status_code=400, detail="Cancelled booking cannot be modified")
    if error_key == "seat_tracking_unavailable":
        raise HTTPException(status_code=400, detail="Seat-level modification not available for this booking")
    if error_key == "seat_required":
        raise HTTPException(status_code=400, detail="Please provide at least one seat to remove")
    if error_key == "seat_not_in_booking":
        raise HTTPException(status_code=400, detail="One or more seats are not in this booking")

    response = API.success_with_data("Booking seats updated", "booking", booking)
    response["refund"] = refund
    return response


@router.patch(
    "/{booking_id}/seats/replace",
    summary="Replace booking seats",
    description="Replace entire seat selection (add/remove) and return settlement details.",
    responses={
        400: {"description": "Replacement seat selection is invalid"},
        403: {"description": "You cannot modify this booking"},
        404: {"description": "Booking, bus, or schedule not found"},
        409: {"description": "One or more selected seats are already booked"},
    },
)
def replace_seats(booking_id: int, payload: ReplaceBookingSeatsInput):
    """Replace all selected seats for a booking.

    Example request body:
    {
        "user_id": 12,
        "seat_labels": ["A1", "B1", "B2"]
    }
    """
    booking, settlement, error_key = replace_booking_seats(
        booking_id=booking_id,
        user_id=payload.user_id,
        seat_labels=payload.seat_labels,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail="You cannot modify this booking")
    if error_key == "cancelled":
        raise HTTPException(status_code=400, detail="Cancelled booking cannot be modified")
    if error_key == "seat_tracking_unavailable":
        raise HTTPException(status_code=400, detail="Seat-level modification not available for this booking")
    if error_key == "schedule":
        raise HTTPException(status_code=404, detail="Schedule not found")
    if error_key == "bus":
        raise HTTPException(status_code=404, detail=DETAIL_BUS_NOT_FOUND)
    if error_key == "seat_limit":
        raise HTTPException(status_code=400, detail="Seat selection exceeds bus transaction limit")
    if error_key == "seat_invalid":
        raise HTTPException(status_code=400, detail="One or more selected seats are invalid")
    if error_key == "seat_blocked":
        raise HTTPException(status_code=400, detail="One or more selected seats are currently blocked")
    if error_key == "seat_booked":
        raise HTTPException(status_code=409, detail="One or more selected seats are already booked")

    response = API.success_with_data("Booking seat selection replaced", "booking", booking)
    response["settlement"] = settlement
    return response


@router.patch(
    "/{booking_id}/payment",
    summary="Confirm payment",
    description="Mark booking payment state by method after successful checkout.",
    responses={
        403: {"description": "Payment update is forbidden for this user or pay-later mode"},
        404: {"description": "Booking not found"},
    },
)
def confirm_payment(booking_id: int, payload: ConfirmBookingPaymentInput):
    """Update payment state for booking."""
    booking, error_key = confirm_booking_payment(
        booking_id=booking_id,
        user_id=payload.user_id,
        payment_method=payload.payment_method,
        pay_later=payload.pay_later,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail=DETAIL_CANNOT_UPDATE_BOOKING)
    if error_key == "pay_later_forbidden":
        raise HTTPException(status_code=403, detail="Pay later is only available for vendor bookings")

    return API.success_with_data("Payment status updated", "booking", booking)


@router.patch(
    "/{booking_id}/confirm-payment",
    summary="Confirm payment (legacy alias)",
    description="Backward-compatible alias of /{booking_id}/payment.",
    responses={
        403: {"description": "Payment update is forbidden for this user or pay-later mode"},
        404: {"description": "Booking not found"},
    },
)
def confirm_payment_legacy(booking_id: int, payload: ConfirmBookingPaymentInput):
    return confirm_payment(booking_id, payload)


@router.post(
    "/{booking_id}/payment/esewa/verify",
    summary="Verify eSewa payment",
    description="Verify eSewa transaction with gateway and confirm booking on successful verification.",
    responses={
        400: {"description": "Invalid eSewa verification input or payment not complete"},
        403: {"description": "Payment update is forbidden for this user"},
        404: {"description": "Booking not found"},
        502: {"description": "eSewa verification failed"},
        503: {"description": "eSewa service is not configured"},
    },
)
def verify_esewa_payment(booking_id: int, payload: EsewaVerifyPaymentInput):
    """Verify eSewa transaction.

    Example request body:
    {
        "user_id": 12,
        "ref_id": "ESEWA-REF-001",
        "amount": 2400,
        "product_id": "BK20260401121212"
    }
    """
    verification, verify_error = verify_esewa_transaction(
        ref_id=payload.ref_id,
        amount=payload.amount,
        product_id=payload.product_id,
    )

    if verify_error == "config":
        raise HTTPException(status_code=503, detail="eSewa merchant configuration missing")
    if verify_error == "ref_required":
        raise HTTPException(status_code=400, detail="eSewa reference id is required")
    if verify_error == "network":
        raise HTTPException(status_code=502, detail="Unable to reach eSewa verification service")
    if verify_error in {"verification_failed", "invalid_response"}:
        raise HTTPException(status_code=502, detail="eSewa verification failed")
    if verify_error == "not_complete":
        raise HTTPException(status_code=400, detail="eSewa transaction is not COMPLETE")

    booking, error_key = confirm_booking_payment(
        booking_id=booking_id,
        user_id=payload.user_id,
        payment_method="esewa",
        pay_later=False,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail=DETAIL_CANNOT_UPDATE_BOOKING)

    response = API.success_with_data("eSewa payment verified and booking confirmed", "booking", booking)
    response["esewa_verification"] = verification
    return response


@router.post(
    "/{booking_id}/payment/khalti/verify",
    summary="Verify Khalti payment",
    description="Verify Khalti pidx transaction and confirm booking on successful verification.",
    responses={
        400: {"description": "Invalid Khalti verification input or payment not complete"},
        403: {"description": "Payment update is forbidden for this user"},
        404: {"description": "Booking not found"},
        502: {"description": "Khalti verification failed"},
        503: {"description": "Khalti service is not configured"},
    },
)
def verify_khalti_payment(booking_id: int, payload: KhaltiVerifyPaymentInput):
    """Verify Khalti transaction.

    Example request body:
    {
        "user_id": 12,
        "pidx": "test-pidx-12345",
        "amount": 2400,
        "purchase_order_id": "BK20260401121212"
    }
    """
    verification, verify_error = verify_khalti_transaction(
        pidx=payload.pidx,
        amount=payload.amount,
        purchase_order_id=payload.purchase_order_id,
    )

    if verify_error == "config":
        raise HTTPException(status_code=503, detail="Khalti merchant configuration missing")
    if verify_error == "pidx_required":
        raise HTTPException(status_code=400, detail="Khalti pidx is required")
    if verify_error == "network":
        raise HTTPException(status_code=502, detail="Unable to reach Khalti verification service")
    if verify_error in {"verification_failed", "invalid_response"}:
        raise HTTPException(status_code=502, detail="Khalti verification failed")
    if verify_error == "not_complete":
        raise HTTPException(status_code=400, detail="Khalti transaction is not Completed")

    booking, error_key = confirm_booking_payment(
        booking_id=booking_id,
        user_id=payload.user_id,
        payment_method="khalti",
        pay_later=False,
    )
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail=DETAIL_CANNOT_UPDATE_BOOKING)

    response = API.success_with_data("Khalti payment verified and booking confirmed", "booking", booking)
    response["khalti_verification"] = verification
    return response


@router.post(
    "/{booking_id}/payment/esewa/initiate",
    summary="Initiate eSewa payment",
    description="Create eSewa payment request and return redirect URL to eSewa payment portal.",
    responses={
        400: {"description": "Invalid eSewa initiation input"},
        403: {"description": "User access forbidden"},
        404: {"description": "Booking not found"},
        503: {"description": "eSewa service is not configured"},
    },
)
def initiate_esewa_payment_endpoint(booking_id: int, payload: InitiateEsewaPaymentInput):
    """Initiate eSewa payment session.

    Example request body:
    {
        "user_id": 12,
        "amount": 2400,
        "product_id": "BK20260401121212",
        "success_url": "https://example.com/booking/callback?status=success",
        "failure_url": "https://example.com/booking/callback?status=failure",
        "cancel_url": "https://example.com/booking/callback?status=cancel"
    }
    """
    payment_request, error_code = initiate_esewa_payment(
        booking_id=booking_id,
        user_id=payload.user_id,
        amount=payload.amount,
        product_id=payload.product_id,
        success_url=payload.success_url,
        failure_url=payload.failure_url,
        cancel_url=payload.cancel_url,
    )

    if error_code == "config":
        raise HTTPException(status_code=503, detail="eSewa merchant configuration missing")
    if error_code == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_code == "forbidden":
        raise HTTPException(status_code=403, detail=DETAIL_CANNOT_UPDATE_BOOKING)
    if error_code == "amount_required":
        raise HTTPException(status_code=400, detail="Payment amount is required")
    if error_code == "product_id_required":
        raise HTTPException(status_code=400, detail="Product identifier is required")

    return API.success_with_data("eSewa payment initiated", "payment_request", payment_request)


@router.post(
    "/{booking_id}/payment/khalti/initiate",
    summary="Initiate Khalti payment",
    description="Create Khalti payment request and return redirect URL to Khalti payment portal.",
    responses={
        400: {"description": "Invalid Khalti initiation input"},
        403: {"description": "User access forbidden"},
        404: {"description": "Booking not found"},
        503: {"description": "Khalti service is not configured"},
    },
)
def initiate_khalti_payment_endpoint(booking_id: int, payload: InitiateKhaltiPaymentInput):
    """Initiate Khalti payment session.

    Example request body:
    {
        "user_id": 12,
        "amount": 2400,
        "purchase_order_id": "BK20260401121212",
        "success_url": "https://example.com/booking/callback?status=success",
        "failure_url": "https://example.com/booking/callback?status=failure",
        "cancel_url": "https://example.com/booking/callback?status=cancel"
    }
    """
    payment_request, error_code = initiate_khalti_payment(
        booking_id=booking_id,
        user_id=payload.user_id,
        amount=payload.amount,
        purchase_order_id=payload.purchase_order_id,
        success_url=payload.success_url,
        failure_url=payload.failure_url,
        cancel_url=payload.cancel_url,
    )

    if error_code == "config":
        raise HTTPException(status_code=503, detail="Khalti merchant configuration missing")
    if error_code == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_code == "forbidden":
        raise HTTPException(status_code=403, detail=DETAIL_CANNOT_UPDATE_BOOKING)
    if error_code == "amount_required":
        raise HTTPException(status_code=400, detail="Payment amount is required")
    if error_code == "purchase_order_id_required":
        raise HTTPException(status_code=400, detail="Purchase order identifier is required")

    return API.success_with_data("Khalti payment initiated", "payment_request", payment_request)


@router.get(
    "/{booking_id}/ticket.pdf",
    summary="Download booking ticket PDF",
    description="Generate and download ticket PDF for booking owner.",
    responses={
        403: {"description": "You cannot download this booking ticket"},
        404: {"description": "Booking not found"},
        500: {"description": "Ticket generation failed"},
    },
)
def download_ticket(booking_id: int, user_id: int):
    """Download ticket PDF.

    Example query:
    /api/bookings/44/ticket.pdf?user_id=12
    """
    pdf_bytes, error_key = get_booking_ticket_pdf(booking_id=booking_id, user_id=user_id)
    if error_key == "booking":
        raise HTTPException(status_code=404, detail=DETAIL_BOOKING_NOT_FOUND)
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail="You cannot download this booking ticket")
    if error_key == "schedule" or error_key == "bus":
        raise HTTPException(status_code=500, detail="Unable to generate ticket")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ticket_BK{booking_id}.pdf"},
    )
