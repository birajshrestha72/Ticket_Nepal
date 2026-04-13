from datetime import date

from pydantic import BaseModel, ConfigDict, Field


EXAMPLE_EMAIL = "user@example.com"
DESC_ROUTE_FROM = "Route origin city"
DESC_ROUTE_TO = "Route destination city"
DESC_BOOKING_OWNER = "Booking owner identifier"
DESC_EXPECTED_AMOUNT = "Expected paid amount"
DESC_CUSTOMER_USER = "Customer user identifier"


class RegisterInput(BaseModel):
    """Payload for standard user registration."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Sample User",
                "email": EXAMPLE_EMAIL,
                "role": "student",
            }
        }
    )

    name: str = Field(description="Display name for the account")
    email: str = Field(description="Email address used as login identifier")
    password: str = Field(description="Plain text password (hashed server-side)")
    role: str | None = Field(default=None, description="Role hint such as student or customer")


class LoginInput(BaseModel):
    """Payload for email/password sign in."""

    model_config = ConfigDict(json_schema_extra={"example": {"email": EXAMPLE_EMAIL}})

    email: str = Field(description="Registered account email")
    password: str = Field(description="Account password")


class ForgotPasswordInput(BaseModel):
    """Payload for forgot password and resend verification operations."""

    model_config = ConfigDict(json_schema_extra={"example": {"email": EXAMPLE_EMAIL}})

    email: str = Field(description="Registered email to receive reset or verify link")


class ResetPasswordInput(BaseModel):
    """Payload to set a new password for a user email."""

    model_config = ConfigDict(json_schema_extra={"example": {"email": EXAMPLE_EMAIL}})

    email: str = Field(description="Registered email")
    new_password: str = Field(description="New password with minimum length policy")


class UpdateUserProfileInput(BaseModel):
    """Payload for user profile updates."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Updated Name",
                "phone": "+977-9841234567",
            }
        }
    )

    name: str = Field(description="Display name for the account")
    phone: str | None = Field(default=None, description="Phone number (optional, unique)")
class GoogleLoginInput(BaseModel):
    """Payload for Firebase/Google token login."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."}}
    )

    id_token: str = Field(description="Firebase ID token received from frontend OAuth flow")


class CreateBusInput(BaseModel):
    """Public bus creation payload (basic route and fare)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bus_name": "Greenline Express",
                "from_city": "Kathmandu",
                "to_city": "Pokhara",
                "price": 1200,
            }
        }
    )

    bus_name: str = Field(description="Bus display name or registration alias")
    from_city: str = Field(description=DESC_ROUTE_FROM)
    to_city: str = Field(description=DESC_ROUTE_TO)
    price: float = Field(description="Base seat fare in NPR")


class AdminCreateBusInput(BaseModel):
    """Admin payload to create a bus with full operational metadata."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bus_name": "Deluxe Coach 101",
                "bus_type": "Deluxe",
                "from_city": "Kathmandu",
                "to_city": "Chitwan",
                "price": 900,
                "seat_capacity": 80,
            }
        }
    )

    bus_name: str = Field(description="Bus name or number")
    bus_type: str = Field(default="Standard", description="Bus category, e.g. Standard/Deluxe/Sleeper")
    from_city: str = Field(description=DESC_ROUTE_FROM)
    to_city: str = Field(description=DESC_ROUTE_TO)
    price: float = Field(description="Default fare for generated schedule")
    seat_capacity: int = Field(default=80, ge=1, description="Total active seats intended for this bus (standard: 4 columns × 20 rows = 80 seats)")


class AdminUpdateBusInput(BaseModel):
    """Admin payload to update bus metadata and seat capacity."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bus_name": "Deluxe Coach 101",
                "bus_type": "Deluxe",
                "from_city": "Kathmandu",
                "to_city": "Pokhara",
                "price": 1300,
                "seat_capacity": 38,
            }
        }
    )

    bus_name: str = Field(description="Updated bus name")
    bus_type: str = Field(description="Updated bus type")
    from_city: str = Field(description=DESC_ROUTE_FROM)
    to_city: str = Field(description=DESC_ROUTE_TO)
    price: float = Field(description="Updated fare")
    seat_capacity: int = Field(ge=1, description="Updated seat capacity")


class StatusInput(BaseModel):
    """Generic activation payload used by status toggle endpoints."""

    model_config = ConfigDict(json_schema_extra={"example": {"is_active": True}})

    is_active: bool = Field(description="True to activate, False to deactivate")


class AdminCreateRouteInput(BaseModel):
    """Admin payload to create a travel route."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"from_city": "Kathmandu", "to_city": "Biratnagar", "distance_km": 390}}
    )

    from_city: str = Field(description="Route origin city")
    to_city: str = Field(description="Route destination city")
    distance_km: float = Field(description="Approximate route distance in kilometers")


class AdminUpdateRouteInput(BaseModel):
    """Admin payload to update an existing route."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"from_city": "Kathmandu", "to_city": "Pokhara", "distance_km": 200}}
    )

    from_city: str = Field(description="Updated origin city")
    to_city: str = Field(description="Updated destination city")
    distance_km: float = Field(description="Updated route distance")


class AdminCreateScheduleInput(BaseModel):
    """Admin payload to create a bus schedule slot."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bus_id": 3,
                "route_id": 2,
                "departure_time": "07:30",
                "arrival_time": "13:00",
                "fare": 1250,
            }
        }
    )

    bus_id: int = Field(description="Target bus identifier")
    route_id: int = Field(description="Route identifier")
    departure_time: str = Field(description="Departure time in HH:MM format")
    arrival_time: str = Field(description="Arrival time in HH:MM format")
    fare: float = Field(description="Seat fare for this schedule")


class AdminUpdateScheduleInput(BaseModel):
    """Admin payload to update an existing schedule."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "bus_id": 3,
                "route_id": 2,
                "departure_time": "08:00",
                "arrival_time": "13:30",
                "fare": 1350,
            }
        }
    )

    bus_id: int = Field(description="Updated bus identifier")
    route_id: int = Field(description="Updated route identifier")
    departure_time: str = Field(description="Updated departure time in HH:MM format")
    arrival_time: str = Field(description="Updated arrival time in HH:MM format")
    fare: float = Field(description="Updated fare")


class AdminSeatCellInput(BaseModel):
    """Single seat-cell configuration used in bus layout management."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "row_index": 1,
                "col_index": 2,
                "seat_label": "A2",
                "is_active": True,
                "is_blocked": True,
                "block_reason": "maintenance",
            }
        }
    )

    row_index: int = Field(ge=1, description="Seat row position in the grid (1-based)")
    col_index: int = Field(ge=1, description="Seat column position in the grid (1-based)")
    seat_label: str | None = Field(default=None, description="Seat label shown to users")
    is_active: bool = Field(default=True, description="Whether this cell is a usable seat")
    is_blocked: bool = Field(default=False, description="Whether an active seat is blocked from booking")
    block_reason: str | None = Field(default=None, description="Reason for seat blocking")


class AdminSeatLayoutInput(BaseModel):
    """Bus seat-grid payload for admin seat management endpoints."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "seat_layout_rows": 20,
                "seat_layout_cols": 4,
                "seats": [
                    {
                        "row_index": 1,
                        "col_index": 1,
                        "seat_label": "A1",
                        "is_active": True,
                        "is_blocked": False,
                        "block_reason": None,
                    },
                    {
                        "row_index": 1,
                        "col_index": 3,
                        "seat_label": "A3",
                        "is_active": True,
                        "is_blocked": True,
                        "block_reason": "maintenance",
                    },
                ],
            }
        }
    )

    seat_layout_rows: int = Field(ge=1, default=20, description="Number of rows in layout grid (standard: 20)")
    seat_layout_cols: int = Field(ge=1, default=4, description="Number of columns in layout grid (standard: 4)")
    seats: list[AdminSeatCellInput] | None = Field(
        default=None,
        description="Custom seat cells. If omitted, server can generate default cells.",
    )


class CreateBookingInput(BaseModel):
    """Payload to create a booking before payment confirmation."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "bus_id": 4,
                "journey_date": "2026-04-05",
                "seats": 2,
                "seat_labels": ["A1", "A2"],
                "payment_method": "esewa",
                "is_counter_booking": False,
            }
        }
    )

    user_id: int = Field(description=DESC_CUSTOMER_USER)
    bus_id: int = Field(description="Bus identifier to book")
    journey_date: date = Field(description="Date of travel")
    seats: int = Field(ge=1, description="Total seat count requested")
    seat_labels: list[str] | None = Field(default=None, description="Specific seat labels selected by customer")
    payment_method: str | None = Field(default=None, description="Preferred payment method: esewa, khalti, cash")
    is_counter_booking: bool = Field(default=False, description="True for in-office/counter booking flow")


class CancelBookingInput(BaseModel):
    """Payload to cancel an existing booking."""

    model_config = ConfigDict(json_schema_extra={"example": {"user_id": 12}})

    user_id: int = Field(description=DESC_CUSTOMER_USER)


class ModifyBookingSeatsInput(BaseModel):
    """Payload to remove seats from an existing booking."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"user_id": 12, "remove_seat_labels": ["A2"]}}
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    remove_seat_labels: list[str] = Field(description="Seat labels to remove from booking")


class ReplaceBookingSeatsInput(BaseModel):
    """Payload to replace entire booking seat selection in modify flow."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"user_id": 12, "seat_labels": ["A1", "B1", "B2"]}}
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    seat_labels: list[str] = Field(description="Final seat labels to keep after replacement")


class CreateReviewInput(BaseModel):
    """Payload to submit a post-journey review."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "booking_id": 45,
                "rating": 5,
                "review_text": "Comfortable journey and punctual departure.",
            }
        }
    )

    user_id: int = Field(description="Reviewer user identifier")
    booking_id: int = Field(description="Booking being reviewed")
    rating: int = Field(ge=1, le=5)
    review_text: str | None = Field(default=None, description="Optional text feedback")


class ConfirmBookingPaymentInput(BaseModel):
    """Payload to mark booking payment state after checkout."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"user_id": 12, "payment_method": "esewa", "pay_later": False}}
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    payment_method: str = Field(description="Payment mode used to settle booking")
    pay_later: bool = Field(default=False, description="Set true only for allowed counter/vendor flows")


class EsewaVerifyPaymentInput(BaseModel):
    """Payload to verify eSewa payment and finalize booking."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "ref_id": "ESEWA-REF-00012",
                "amount": 2400,
                "product_id": "BK20260401121212",
            }
        }
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    ref_id: str = Field(description="Reference id returned by eSewa")
    amount: float | None = Field(default=None, description=DESC_EXPECTED_AMOUNT)
    product_id: str | None = Field(default=None, description="Optional booking/product id used during checkout")


class KhaltiVerifyPaymentInput(BaseModel):
    """Payload to verify Khalti payment and finalize booking."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "pidx": "test-pidx-12345",
                "amount": 2400,
                "purchase_order_id": "BK20260401121212",
            }
        }
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    pidx: str = Field(description="Khalti pidx transaction identifier")
    amount: float | None = Field(default=None, description=DESC_EXPECTED_AMOUNT)
    purchase_order_id: str | None = Field(default=None, description="Purchase order identifier")


class InitiateEsewaPaymentInput(BaseModel):
    """Payload to initiate eSewa payment session."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "amount": 2400,
                "product_id": "BK20260401121212",
                "success_url": "https://example.com/booking/callback?status=success",
                "failure_url": "https://example.com/booking/callback?status=failure",
                "cancel_url": "https://example.com/booking/callback?status=cancel",
            }
        }
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    amount: float = Field(gt=0, description="Payment amount in NPR")
    product_id: str = Field(description="Booking reference or product identifier")
    success_url: str = Field(description="Redirect URL after successful payment")
    failure_url: str = Field(description="Redirect URL after failed payment")
    cancel_url: str = Field(description="Redirect URL if user cancels payment")


class InitiateKhaltiPaymentInput(BaseModel):
    """Payload to initiate Khalti payment session."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "amount": 2400,
                "purchase_order_id": "BK20260401121212",
                "success_url": "https://example.com/booking/callback?status=success",
                "failure_url": "https://example.com/booking/callback?status=failure",
                "cancel_url": "https://example.com/booking/callback?status=cancel",
            }
        }
    )

    user_id: int = Field(description=DESC_BOOKING_OWNER)
    amount: float = Field(gt=0, description="Payment amount in NPR")
    purchase_order_id: str = Field(description="Booking reference identifier")
    success_url: str = Field(description="Redirect URL after successful payment")
    failure_url: str = Field(description="Redirect URL after failed payment")
    cancel_url: str = Field(description="Redirect URL if user cancels payment")


class SuperAdminCreateVendorInput(BaseModel):
    """Payload for superadmin to create vendor credentials directly."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"name": "Himalayan Travels", "email": "vendor@example.com"}
        }
    )

    name: str = Field(description="Vendor account display name")
    email: str = Field(description="Vendor login email")
    password: str = Field(description="Initial vendor password")


class SuperAdminUpdateVendorInput(BaseModel):
    """Payload for partial vendor profile/status updates by superadmin."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"name": "Himalayan Travels Pvt Ltd", "is_active": True}}
    )

    name: str | None = Field(default=None, description="Updated vendor name")
    email: str | None = Field(default=None, description="Updated vendor email")
    is_active: bool | None = Field(default=None, description="Optional activation status toggle")


class PaymentOrderCreateInput(BaseModel):
    """Create payment-first order before Khalti checkout."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 12,
                "trip_id": 8,
                "journey_date": "2026-04-18",
                "seat_labels": ["A1", "A2"],
                "amount": 2400,
            }
        }
    )

    user_id: int = Field(description=DESC_CUSTOMER_USER)
    trip_id: int = Field(description="Trip identifier (maps to bus_schedules.schedule_id)")
    journey_date: date = Field(description="Journey date selected by customer")
    seat_labels: list[str] = Field(description="Selected seat labels")
    amount: float = Field(gt=0, description="Total expected payable amount")


class PaymentOrderInitiateInput(BaseModel):
    """Initiate Khalti checkout for an existing pending payment order."""

    model_config = ConfigDict(json_schema_extra={"example": {"order_id": 101, "user_id": 12}})

    order_id: int = Field(description="Payment order identifier")
    user_id: int = Field(description=DESC_CUSTOMER_USER)


class PaymentOrderKhaltiVerifyInput(BaseModel):
    """Verify Khalti checkout using returned pidx."""

    model_config = ConfigDict(json_schema_extra={"example": {"pidx": "XM8A9k..."}})

    pidx: str = Field(min_length=1, description="Khalti pidx transaction identifier")


class RefundSimulationInput(BaseModel):
    """Simulate refund operation for college project flow."""

    model_config = ConfigDict(
        json_schema_extra={"example": {"order_id": 101, "user_id": 12, "reason": "manual review"}}
    )

    order_id: int = Field(description="Paid order identifier")
    user_id: int = Field(description="Order owner identifier")
    reason: str | None = Field(default=None, description="Optional reason for refund simulation")
