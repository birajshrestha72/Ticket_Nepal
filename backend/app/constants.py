# ============================================================================
# Constants Module / Sabaike Sabait Sthai Rakhne Kura
# ============================================================================
# Yo file ma sabaike project-wide constants (sabait) rakhne ho.
# This module holds all project-wide constants and configuration values.
# ============================================================================

SEAT_PREFIX = "SEATS:"  # Seat labels ko prefix - seat label ko jeevo chinh

# ============================================================================
# Role Ko Sitai Haru (User Roles)
# ============================================================================
ROLE_CUSTOMER = "customer"
ROLE_STUDENT = "student"  # Legacy alias kept for older seeded data and records
ROLE_VENDOR = "vendor"
ROLE_ADMIN = "admin"  # SuperAdmin ko lagi

VALID_ROLES = {ROLE_CUSTOMER, ROLE_STUDENT, ROLE_VENDOR, ROLE_ADMIN}

# ============================================================================
# Vendor Registration Ko Sart Haru (Vendor Document Validation)
# ============================================================================
ALLOWED_VENDOR_DOC_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_VENDOR_DOC_BYTES = 5 * 1024 * 1024  # 5MB - vendor document ko maximum size

# ============================================================================
# Bus Ko Prakar Haru (Bus Types & Configurations)
# ============================================================================
BUS_TYPE_STANDARD = "Standard"
BUS_TYPE_SLEEPER = "Sleeper"
BUS_TYPE_MINI = "Mini"

# Default seat columns by bus type - bus ko type anusaar seat ko column
DEFAULT_SEAT_COLUMNS = {
    "sleeper": 3,
    "mini": 4,
    "standard": 4,
}

# ============================================================================
# Booking Status (Booking Ko Sthiti)
# ============================================================================
BOOKING_STATUS_PENDING = "pending"
BOOKING_STATUS_CONFIRMED = "confirmed"
BOOKING_STATUS_CANCELLED = "cancelled"  # Kina sakeko
BOOKING_STATUS_COMPLETED = "completed"

# ============================================================================
# Refund Policy (Paise Phertane Ko Niyam)
# ============================================================================
# Hours before departure ko time period ma refund percentage define garne
REFUND_RULES = {
    "full_refund_hours_before": 48,      # 48 ghanta aghi - full refund
    "partial_refund_hours_before": 24,   # 24 ghanta aghi - 50% refund
    "full_refund_percent": 100.0,
    "partial_refund_percent": 50.0,
    "no_refund_percent": 0.0,            # Journey start bhanda kati close bhayo bhane refund nai hundaina
}

# ============================================================================
# Review Policy (Reviewer Niti)
# ============================================================================
REVIEW_MINIMUM_HOURS_AFTER_JOURNEY = 24  # Journey ko 24 ghanta pachhi review garna sakine
REVIEW_MINIMUM_RATING = 1
REVIEW_MAXIMUM_RATING = 5

# ============================================================================
# Email Ko Shart Haru (Email Configuration)
# ============================================================================
SMTP_SERVER_DEFAULT = "smtp.gmail.com"
SMTP_PORT_DEFAULT = 587
SENDER_EMAIL_DEFAULT = "noreply@ticketnepal.com"

# ============================================================================
# Pagination (Dalal Dalal Herne Ko Niyam)
# ============================================================================
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ============================================================================
# Search & Filter Constants
# ============================================================================
SEAT_AVAILABILITY_THRESHOLD = 5  # Seat availability warning ko lagi

# ============================================================================
# Time Constants (Samay Ko Stangar)
# ============================================================================
TIME_FORMAT = "%H:%M"
DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%dT%H:%M"
