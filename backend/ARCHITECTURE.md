# ============================================================================
# SEPARATION OF CONCERNS - PROJECT STRUCTURE GUIDE
# CONCERN KO ALAG ALAG THALI BANANE KO GUIDE
# ============================================================================
#
# Yo project bilingual (English + Roman Nepali) comments use garchha.
# Hrek functionality ko alag file ma organize gako chha.
# Each layer has specific responsibilities following best practices.
#
# ============================================================================
# BACKEND ARCHITECTURE 
# ============================================================================
#
# backend/app/
# ├── main.py                      # FastAPI app setup (router includes)
# ├── constants.py                 # Global constants va configurable values
# ├── config/
# │   ├── database.py             # Database connection settings
# │   └── firebase.py             # Firebase authentication setup
# ├── model/
# │   ├── models.py               # SQLAlchemy database models
# │   └── schemas.py              # Pydantic validation schemas
# ├── utils/                        # Reusable utility functions
# │   ├── __init__.py
# │   ├── validators.py           # Input validation functions
# │   └── formatters.py           # Output formatting functions
# ├── services/
# │   ├── auth_service.py         # Authentication logic (register, login, Google OAuth)
# │   ├── user_service.py         # User info retrieval
# │   ├── bus_service.py          # Bus management logic
# │   ├── route_service.py        # Route management
# │   ├── schedule_service.py     # Bus schedule management
# │   ├── booking_service.py      # Booking creation, payment, refunds
# │   ├── review_service.py       # Review submission and retrieval
# │   ├── admin_service.py        # Vendor admin dashboard logic
# │   ├── superadmin_service.py   # System-wide admin operations
# │   ├── email_service.py        # SMTP email sending
# │   └── pdf_service.py          # PDF ticket generation
# ├── controller/                   # Request handlers (routes)
# │   ├── auth_controller.py      # Auth endpoints
# │   ├── user_controller.py      # User endpoints
# │   ├── bus_controller.py       # Bus endpoints
# │   ├── booking_controller.py   # Booking endpoints
# │   ├── review_controller.py    # Review endpoints
# │   ├── admin_controller.py     # Vendor admin endpoints
# │   └── superadmin_controller.py # System admin endpoints
# ├── api/
# │   └── response.py             # Standardized API response format
# └── uploads/                      # File storage directory
#     └── vendor_docs/            # Vendor document uploads
#
# ============================================================================
# LAYER RESPONSIBILITIES / HAR LAYER KO JIMMEDARI
# ============================================================================
#
# 1. CONTROLLER LAYER (HTTP Request/Response)
#    Jimmedari: 
#    - HTTP request accept garne
#    - Input validation trigger garne
#    - Service layer call garne
#    - Response format ma data convert garne
#    - Error handling garne
#
#    Pattern: 
#    @router.post("/endpoint")
#    def handle_request(payload: SchemaInput):
#        result, error = service.do_operation(payload.field)
#        if error:
#            raise HTTPException(status_code=400, detail=error)
#        return API.success_with_data(message, key, result)
#
# ============================================================================
#
# 2. SERVICE LAYER (Business Logic)
#    Jimmedari:
#    - Database operations (create, read, update, delete)
#    - Business rule enforcement
#    - Data validation at business level
#    - Cross-entity logic (bookings affecting inventory, etc.)
#    - Integration of related operations
#
#    Pattern:
#    def do_operation(user_id: int, item_id: int):
#        with get_session() as db:
#            # Existence check
#            user = db.execute(select(User).where(...)).scalar_one_or_none()
#            if user is None:
#                return None, "error_key"
#            # Business logic
#            # Database changes
#            db.commit()
#            return formatted_result, None
#
# 3. MODEL LAYER (Data Structure)
#    Jimmedari:
#    - Database schema definition (models.py)
#    - API request/response schema (schemas.py)
#    - Type hints ra validation rules
#
# 4. UTILITY LAYER (Helpers)
#    Jimmedari:
#    - validators.py: Input validation functions (reusable across endpoints)
#    - formatters.py: Data formatting for display (time, currency, enums)
#    - constants.py: Project-wide constants
#
# 5. CONFIG LAYER (Infrastructure)
#    Jimmedari:
#    - Database connection setup
#    - Environment variable loading
#    - External service configuration (Firebase)
#
# ============================================================================
# BILINGUAL COMMENT CONVENTION / COMMENT KO NIYAM
# ============================================================================
#
# Code comment format:
#
#    def function_name():
#        \"\"\"
#        Nepali explanation (Roman Nepali) - Kya?
#        English explanation - What does this do?
#        
#        Args:
#            param: Description (Nepali then English)
#        
#        Returns:
#            value: Description (Nepali then English)
#        \"\"\"
#
# Inline comments:
#    # Inline Nepali - English explanation
#
# Section headers (consistent formatting):
#    # ============================================================================
#    # SECTION NAME / SECTION KO NEPALI NAM
#    # ============================================================================
#
# ============================================================================
# NAMING CONVENTIONS / NAM RAKHNE KO NIYAM
# ============================================================================
#
# Services:
#    - *_service.py: auth_service, booking_service, bus_service
#    - Function names: list_items(), find_item(), create_item(), update_item(), delete_item()
#    - Private functions: _helper_function() starts with underscore
#
# Controllers:
#    - *_controller.py: auth_controller, booking_controller
#    - Endpoint handlers: describe action (list_bookings, create_booking, get_booking)
#    - Router: one router per controller
#
# Utils:
#    - validators.py: validate_email(), validate_password(), validate_seat_labels()
#    - formatters.py: format_time(), format_currency(), format_status()
#
# Constants:
#    - UPPER_CASE with underscores: ROLE_STUDENT, MAX_SEATS, BOOKING_STATUS_PENDING
#    - Group related: REFUND_RULES = {...}
#    - Maps for translations: STATUS_DISPLAY_MAP = {...}
#
# ============================================================================
# ERROR HANDLING PATTERN / ERROR HANDLE GARNE TAREEKA
# ============================================================================
#
# Service layer returns tuple: (result, error_key)
#
#    if error_key == "user":
#        raise HTTPException(status_code=404, detail="User not found")
#    if error_key == "validation":
#        raise HTTPException(status_code=400, detail="Invalid input")
#    if error_key == "forbidden":
#        raise HTTPException(status_code=403, detail="Access denied")
#
# Service never raises HTTPException - controller decides status code
#
# ============================================================================
# DATA FLOW EXAMPLE: CREATE BOOKING / BOOKING CREATE GARNE KHEL
# ============================================================================
#
# Frontend → POST /api/bookings with { user_id, bus_id, seats, date }
#    ↓
# booking_controller.py
#    - Parse request
#    - Validate with schema
#    - Call: create_booking_record(...)
#    ↓
# booking_service.py :: create_booking()
#    - Validate user exists
#    - Validate bus exists
#    - Validate seat count
#    - Check seat availability
#    - Create Booking record
#    - Return (booking_data, None)
#    ↓
# booking_controller.py
#    - Check error_key
#    - If success: return API.success_with_data(...)
#    - If error: raise HTTPException(...)
#    ↓
# Frontend receives { message, booking: { ... } }
#
# ============================================================================
#
# When user confirms payment:
#    ↓
# booking_controller.py :: /bookings/{booking_id}/confirm-payment
#    - Call: confirm_booking_payment(...)
#    ↓
# booking_service.py :: confirm_booking_payment()
#    - Update booking status = "confirmed"
#    - Call: _send_booking_confirmation_email()
#    ↓
# email_service.py :: _send_booking_confirmation_email()
#    - Fetch booking details
#    - Format HTML template
#    - Call: send_email(recipient, subject, html)
#    ↓
# Email sent to user ✓
#
# When user wants PDF:
#    ↓
# Frontend: GET /api/bookings/{booking_id}/ticket.pdf?user_id={user_id}
#    ↓
# booking_controller.py
#    - Validate user owns booking
#    - Call: get_booking_ticket_pdf(...)
#    ↓
# booking_service.py :: get_booking_ticket_pdf()
#    - Fetch booking + schedule + bus data
#    - Call: generate_ticket_pdf(...)
#    ↓
# pdf_service.py :: generate_ticket_pdf()
#    - Create ReportLab document
#    - Format ticket layout
#    - Return PDF bytes
#    ↓
# booking_controller.py
#    - Return FileResponse(content=pdf_bytes, filename=...)
#    ↓
# Frontend receives PDF file download ✓
#
# ============================================================================
# TESTING APPROACH / TESTING KO TAREEKA
# ============================================================================
#
# Unit tests: validators, formatters (utility functions)
# Integration tests: service functions with database
# E2E tests: controller endpoints with full request/response
#
# ============================================================================
# FUTURE IMPROVEMENTS / AGANTY KO SUDHAR
# ============================================================================
#
# - Add comprehensive logging service (info, debug, error levels)
# - Create exception_handler.py for centralized error mapping
# - Add middleware for request/response logging
# - Implement caching layer for frequently accessed data
# - Add API rate limiting middleware
# - Create DTOs (Data Transfer Objects) for strict in/out types
# - Add comprehensive integration tests
# - Add documentation generation (Auto-generated API docs)
# - Implement database transaction management for complex operations
#
# ============================================================================
