"""Compatibility exports for model classes.

Model classes are now organized per file:
- user.py
- vendor_document.py
- bus.py
- route.py
- bus_schedule.py
- booking.py
- review.py
"""

from app.model.booking import Booking
from app.model.bus import Bus, BusSeat
from app.model.bus_schedule import BusSchedule
from app.model.payment_order import PaymentOrder
from app.model.review import Review
from app.model.route import Route
from app.model.user import User
from app.model.vendor_document import VendorDocument

__all__ = [
    "User",
    "VendorDocument",
    "Bus",
    "BusSeat",
    "Route",
    "BusSchedule",
    "PaymentOrder",
    "Booking",
    "Review",
]
