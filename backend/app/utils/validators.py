# ============================================================================
# Validators Module / Input Validation Ko Kura
# ============================================================================
# Yo file ma user input ko validation rules rakhne ho.
# This module provides validation functions for various inputs like email,
# seats, dates, passwords, etc.
# ============================================================================

import re
from datetime import datetime, date


# ============================================================================
# Email Validation / Email Ko Jach
# ============================================================================
def validate_email(email: str) -> tuple[bool, str | None]:
    """
    Email address ko validity check garne function
    Validates email format using regex pattern
    Returns: (is_valid: bool, error_message: str | None)
    """
    if not email or not isinstance(email, str):
        return False, "Email required ho"
    
    email = email.strip()
    if not email:
        return False, "Email empty hunna sakta"
    
    # Standard email regex pattern
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        return False, "Email format sahi nai ho"
    
    if len(email) > 200:
        return False, "Email 200 character bhanda alam hunna sakta"
    
    return True, None


# ============================================================================
# Password Validation / Password Ko Strength Check
# ============================================================================
def validate_password(password: str) -> tuple[bool, str | None]:
    """
    Password ko strength check garne
    Validates password length and complexity
    Returns: (is_valid: bool, error_message: str | None)
    """
    if not password or not isinstance(password, str):
        return False, "Password required ho"
    
    if len(password) < 6:
        return False, "Password minimum 6 character hunna parcha"
    
    if len(password) > 255:
        return False, "Password 255 character bhanda alam hunna sakta"
    
    return True, None


# ============================================================================
# Name Validation / Naam Ko Jach
# ============================================================================
def validate_name(name: str) -> tuple[bool, str | None]:
    """
    User/Vendor ko naam validate garne
    Validates name is not empty and reasonable length
    """
    if not name or not isinstance(name, str):
        return False, "Name required ho"
    
    name = name.strip()
    if not name:
        return False, "Name empty hunna sakta"
    
    if len(name) < 2:
        return False, "Name minimum 2 character hunna parcha"
    
    if len(name) > 120:
        return False, "Name 120 character bhanda alam hunna sakta"
    
    return True, None


# ============================================================================
# Seat Labels Validation / Seat Number Ko Jach
# ============================================================================
def validate_seat_labels(seat_labels: list[str] | None) -> tuple[bool, str | None]:
    """
    Seat labels (A1, B2, etc) ko validity check garne
    Validates seat format and quantity
    Returns: (is_valid: bool, error_message: str | None)
    """
    if not seat_labels:
        return False, "Seat labels required ho"
    
    if not isinstance(seat_labels, list):
        return False, "Seat labels array huna parcha"
    
    if len(seat_labels) == 0:
        return False, "Minimum ek seat select garna hunchha"
    
    if len(seat_labels) > 10:
        return False, "Maximum 10 seat ek sathe book garna sakne"
    
    # Each seat label check
    for seat in seat_labels:
        if not isinstance(seat, str):
            return False, f"Invalid seat format: {seat}"
        
        seat = seat.strip().upper()
        if not seat:
            return False, "Seat label empty hunna sakta"
        
        if len(seat) < 2 or len(seat) > 5:
            return False, f"Invalid seat label: {seat}"
    
    return True, None


# ============================================================================
# Date Validation / Miti Ko Jach
# ============================================================================
def validate_journey_date(journey_date: str | date) -> tuple[bool, str | None]:
    """
    Journey date ko validity check garne
    Validates date is in future
    Returns: (is_valid: bool, error_message: str | None)
    """
    try:
        if isinstance(journey_date, date):
            date_obj = journey_date
        else:
            date_obj = datetime.strptime(str(journey_date), "%Y-%m-%d").date()
        
        today = date.today()
        
        if date_obj < today:
            return False, "Atit ko miti select garna sakina"
        
        return True, None
    except (ValueError, TypeError):
        return False, "Date format YYYY-MM-DD huna parcha"


# ============================================================================
# Numeric Validation / Sankhya Ko Jach
# ============================================================================
def validate_positive_number(value: int | float, name: str = "value") -> tuple[bool, str | None]:
    """
    Positive number ko validation (price, distance, etc)
    Returns: (is_valid: bool, error_message: str | None)
    """
    try:
        num = float(value) if value else 0
        if num <= 0:
            return False, f"{name} zero bhanda badhi hunna parcha"
        return True, None
    except (ValueError, TypeError):
        return False, f"{name} valid number hunna parcha"


def validate_seat_count(seats: int) -> tuple[bool, str | None]:
    """
    Booking ma seat count ko validation
    Validates seat quantity is reasonable
    """
    try:
        seat_count = int(seats)
        if seat_count < 1:
            return False, "Minimum ek seat huna parcha"
        if seat_count > 10:
            return False, "Maximum 10 seat ek sathe book garna sakne"
        return True, None
    except (ValueError, TypeError):
        return False, "Seat count valid number hunna parcha"


# ============================================================================
# Payment Method Validation / Payment Method Ko Jach
# ============================================================================
def validate_payment_method(method: str | None) -> tuple[bool, str | None]:
    """
    Payment method ko validation
    Returns: (is_valid: bool, error_message: str | None)
    """
    valid_methods = {"esewa", "khalti", "counter"}
    
    if not method:
        return False, "Payment method required ho"
    
    if method.lower() not in valid_methods:
        return False, f"Valid payment method: {', '.join(valid_methods)}"
    
    return True, None


# ============================================================================
# Rating Validation / Rating Ko Jach
# ============================================================================
def validate_rating(rating: int) -> tuple[bool, str | None]:
    """
    Review rating ko validation (1-5 stars)
    Returns: (is_valid: bool, error_message: str | None)
    """
    try:
        r = int(rating)
        if r < 1 or r > 5:
            return False, "Rating 1-5 ko beech huna parcha"
        return True, None
    except (ValueError, TypeError):
        return False, "Rating valid number hunna parcha"


# ============================================================================
# Review Text Validation / Review Text Ko Jach  
# ============================================================================
def validate_review_text(text: str | None) -> tuple[bool, str | None]:
    """
    Review text ko validation
    Returns: (is_valid: bool, error_message: str | None)
    """
    if not text:
        return True, None  # Optional field
    
    text = str(text).strip()
    
    if len(text) > 1000:
        return False, "Review text 1000 character bhanda alam hunna sakta"
    
    return True, None
