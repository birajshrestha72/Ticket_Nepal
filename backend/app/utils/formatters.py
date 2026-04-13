# ============================================================================
# Formatters Module / Data Ko Sahastha Ramne Ko Kura
# ============================================================================
# Yo file ma data formatting utilities rakhne ho - time, date, currency formats
# This module contains utilities for formatting output data consistently
# ============================================================================

from datetime import time, date, datetime


TRAVELLER_ROLE_LABEL = "Traveller (Yatri)"


# ============================================================================
# Time Formatting / Samay Ko Format
# ============================================================================
def format_time(t: time | None) -> str | None:
    """
    Time object ko string format ma convert garne
    Format: HH:MM (12:30, 14:45, etc)
    Returns: "HH:MM" format string
    """
    if t is None:
        return None
    
    if isinstance(t, str):
        return t
    
    return t.strftime("%H:%M")


def parse_time(value: str) -> time:
    """
    Time string ko time object ma convert garne
    Accepts: "HH:MM", "2000-01-01THH:MM" formats
    Returns: time object
    """
    text = value.strip()
    
    # If contains T, it's ISO datetime format
    if "T" in text:
        dt = datetime.fromisoformat(text)
        return dt.time().replace(second=0, microsecond=0)
    
    try:
        # Try parsing as HH:MM
        return datetime.strptime(text, "%H:%M").time().replace(second=0, microsecond=0)
    except ValueError:
        # Fallback: split by colon
        parts = text.split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        return time(hour, minute)


def time_to_iso_format(t: time) -> str:
    """
    Time object ko ISO format ma convert garne
    Returns: "2000-01-01T14:30" format (dummy date ko saath)
    """
    return f"2000-01-01T{format_time(t)}"


# ============================================================================
# Date Formatting / Miti Ko Format
# ============================================================================
def format_date(d: date | None) -> str | None:
    """
    Date object ko string format ma convert garne
    Format: YYYY-MM-DD
    Returns: "2025-03-24" format string
    """
    if d is None:
        return None
    
    if isinstance(d, str):
        return d
    
    if isinstance(d, datetime):
        return d.date().isoformat()
    
    return d.isoformat()


# ============================================================================
# Currency Formatting / Paisako Format
# ============================================================================
def format_currency(amount: float | int, currency: str = "Rs.") -> str:
    """
    Currency amount ko formatted string ma convert garne
    Returns: "Rs. 1,234.50" format
    
    Args:
        amount: Numeric amount to format
        currency: Currency symbol (default: "Rs.")
    """
    try:
        num = float(amount)
        # Format with 2 decimals and thousands separator
        formatted = f"{num:,.2f}"
        return f"{currency} {formatted}"
    except (ValueError, TypeError):
        return f"{currency} 0.00"


def format_amount_short(amount: float | int) -> str:
    """
    Short format for currency (display ma use hunchha)
    Returns: "1,234" (no decimals)
    """
    try:
        num = float(amount)
        return f"{num:,.0f}"
    except (ValueError, TypeError):
        return "0"


# ============================================================================
# Percentage Formatting / Sanstha Ko Format
# ============================================================================
def format_percentage(value: float | int, decimals: int = 2) -> str:
    """
    Percentage ko format ma rakne
    Returns: "75.50%" format
    """
    try:
        num = float(value)
        format_str = f"{{:.{decimals}f}}%"
        return format_str.format(num)
    except (ValueError, TypeError):
        return "0%"


# ============================================================================
# Status Formatting / Sthiti Ko Display Format
# ============================================================================
STATUS_DISPLAY_MAP = {
    "pending": "Pratikhaa (Pending)",
    "confirmed": "Confirm Bhayo (Confirmed)",
    "cancelled": "Keyak Bhayo (Cancelled)",
    "completed": "Sampanna Bhayo (Completed)",
    "verified": "Sunisshchit Bhayo (Verified)",
    "submitted": "Prayukt Bhayo (Submitted)",
    "approved": "Swikriti Bhayo (Approved)",
    "rejected": "Nirakar Bhayo (Rejected)",
}


def format_status(status: str | None) -> str:
    """
    Status value ko display-friendly format ma convert garne
    Returns: Formatted status with Nepali translation
    """
    if not status:
        return "Unknown"
    
    lower_status = status.lower().strip()
    return STATUS_DISPLAY_MAP.get(lower_status, status)


# ============================================================================
# Role Formatting / Rol Ko Naam
# ============================================================================
ROLE_DISPLAY_MAP = {
    "student": TRAVELLER_ROLE_LABEL,
    "user": TRAVELLER_ROLE_LABEL,
    "customer": TRAVELLER_ROLE_LABEL,
    "vendor": "Bus Operator (Bus Chalak)",
    "admin": "Admin (Prabandhan)",
}


def format_role(role: str | None) -> str:
    """
    User role ko display-friendly format
    Returns: Formatted role with Nepali translation
    """
    if not role:
        return "User"
    
    lower_role = role.lower().strip()
    return ROLE_DISPLAY_MAP.get(lower_role, role)


# ============================================================================
# Bus Type Formatting / Bus Ko Prakar
# ============================================================================
BUS_TYPE_MAP = {
    "standard": "Standard (Sadharan)",
    "sleeper": "Sleeper (Sukha Yatra)",
    "mini": "Mini (Chhoto)",
    "ac": "AC (Antaraal Jalayu)",
    "non-ac": "Non-AC (Antaraal Jalayu Nai Hunna)",
}


def format_bus_type(bus_type: str | None) -> str:
    """
    Bus type ko display format
    Returns: Formatted bus type with Nepali
    """
    if not bus_type:
        return "Standard"
    
    lower_type = bus_type.lower().strip()
    return BUS_TYPE_MAP.get(lower_type, bus_type)


# ============================================================================
# Route Formatting / Marga Ko Format
# ============================================================================
def format_route(from_city: str, to_city: str) -> str:
    """
    Route ko formatted string (Kathmandu -> Pokhara)
    Returns: "From -> To" format
    """
    return f"{from_city} → {to_city}"


# ============================================================================
# Phone Number Formatting / Phone Number Ko Format
# ============================================================================
def format_phone(phone: str | None) -> str | None:
    """
    Phone number ko format ma rakne
    Returns: Formatted phone number
    """
    if not phone:
        return None
    
    # Remove non-digit characters
    digits = "".join(c for c in phone if c.isdigit())
    
    # Nepali standard phone format
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    
    return phone


# ============================================================================
# Distance Formatting / Dur Ko Format
# ============================================================================
def format_distance(distance_km: float | int) -> str:
    """
    Distance ko formatted string
    Returns: "250 km" format
    """
    try:
        dist = float(distance_km)
        if dist < 1:
            return f"{int(dist * 1000)} meters"
        return f"{dist:.1f} km"
    except (ValueError, TypeError):
        return "-- km"


# ============================================================================
# Duration Formatting / Samay Ko Laamta
# ============================================================================
def format_duration_minutes(minutes: int | None) -> str:
    """
    Time duration ko human-readable format
    Returns: "5 hrs 30 mins" format
    """
    if not minutes or minutes < 0:
        return "-- mins"
    
    min_val = int(minutes)
    hours = min_val // 60
    mins = min_val % 60
    
    if hours == 0:
        return f"{mins} mins"
    elif mins == 0:
        return f"{hours} hrs"
    else:
        return f"{hours} hrs {mins} mins"
