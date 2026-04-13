from datetime import datetime, timezone

from sqlalchemy import func, select

from app.config.database import get_session
from app.model.models import Bus, BusSchedule, Route, User, VendorDocument
from app.services.booking_service import list_bookings
from app.services.bus_service import list_buses
from app.services.password_service import hash_password
from app.services.route_service import list_routes
from app.services.schedule_service import list_schedules


def _to_document_url(stored_path: str | None) -> str | None:
    if not stored_path:
        return None
    return f"/uploads/{stored_path.lstrip('/')}"


def _to_vendor_output(vendor: User, document: VendorDocument | None = None) -> dict:
    document_path = document.document_url if document else None
    if document and bool(document.is_verified):
        document_status = "approved"
    elif document:
        document_status = "submitted"
    else:
        document_status = "missing"

    return {
        "vendor_id": vendor.user_id,
        "name": vendor.name,
        "email": vendor.email,
        "phone": vendor.phone,
        "role": vendor.role,
        "is_verified": bool(vendor.is_active),
        "status": "verified" if vendor.is_active else "pending",
        "has_document": bool(document_path),
        "document_status": document_status,
        "company_registration_document_url": _to_document_url(document_path),
    }


def list_vendors() -> list[dict]:
    with get_session() as db:
        vendors = db.execute(
            select(User)
            .where(User.role == "vendor")
            .order_by(User.user_id)
        ).scalars().all()
        if not vendors:
            return []

        vendor_ids = [vendor.user_id for vendor in vendors]
        documents = db.execute(
            select(VendorDocument).where(
                VendorDocument.vendor_id.in_(vendor_ids),
                VendorDocument.document_type == "company_registration",
            )
        ).scalars().all()
        document_by_vendor_id: dict[int, VendorDocument] = {}
        for doc in documents:
            current = document_by_vendor_id.get(doc.vendor_id)
            if current is None:
                document_by_vendor_id[doc.vendor_id] = doc
                continue

            current_uploaded = current.uploaded_at or datetime.min
            next_uploaded = doc.uploaded_at or datetime.min
            if next_uploaded >= current_uploaded:
                document_by_vendor_id[doc.vendor_id] = doc

        return [
            _to_vendor_output(vendor, document_by_vendor_id.get(vendor.user_id))
            for vendor in vendors
        ]


def create_vendor(name: str, email: str, password: str):
    with get_session() as db:
        existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing is not None:
            return None

        vendor = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="vendor",
            is_active=False,
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        return _to_vendor_output(vendor)


def update_vendor(vendor_id: int, name: str | None = None, email: str | None = None, is_active: bool | None = None):
    with get_session() as db:
        vendor = db.execute(
            select(User).where(User.user_id == vendor_id, User.role == "vendor")
        ).scalar_one_or_none()
        if vendor is None:
            return None, "vendor"

        if email and email != vendor.email:
            duplicate = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if duplicate is not None and duplicate.user_id != vendor_id:
                return None, "email"
            vendor.email = email

        if name is not None and name.strip():
            vendor.name = name.strip()

        if is_active is not None:
            vendor.is_active = is_active

        db.commit()
        db.refresh(vendor)
        document = db.execute(
            select(VendorDocument).where(
                VendorDocument.vendor_id == vendor.user_id,
                VendorDocument.document_type == "company_registration",
            )
        ).scalar_one_or_none()
        return _to_vendor_output(vendor, document), None


def verify_vendor(vendor_id: int, is_verified: bool):
    with get_session() as db:
        vendor = db.execute(
            select(User).where(User.user_id == vendor_id, User.role == "vendor")
        ).scalar_one_or_none()
        if vendor is None:
            return None, "vendor"

        document = db.execute(
            select(VendorDocument).where(
                VendorDocument.vendor_id == vendor.user_id,
                VendorDocument.document_type == "company_registration",
            )
        ).scalar_one_or_none()

        vendor.is_active = is_verified
        if document is not None:
            document.is_verified = is_verified
            document.verified_at = datetime.now(timezone.utc) if is_verified else None

        db.commit()
        db.refresh(vendor)
        return _to_vendor_output(vendor, document), None


def delete_vendor(vendor_id: int):
    with get_session() as db:
        vendor = db.execute(
            select(User).where(User.user_id == vendor_id, User.role == "vendor")
        ).scalar_one_or_none()
        if vendor is None:
            return False

        # Archive deleted vendors by role so they no longer appear in superadmin vendor listings.
        vendor.is_active = False
        vendor.role = "vendor_deleted"
        db.commit()
        return True


def get_superadmin_analytics() -> dict:
    vendors = list_vendors()
    bookings = list_bookings()
    buses = list_buses()
    routes = list_routes()
    schedules = list_schedules()

    verified_vendors = [item for item in vendors if item.get("is_verified")]
    pending_vendors = [item for item in vendors if not item.get("is_verified")]

    total_revenue = round(sum(float(item.get("total_amount", 0)) for item in bookings), 2)
    total_booked_seats = sum(int(item.get("seats", 0)) for item in bookings)

    with get_session() as db:
        total_users = db.execute(select(func.count(User.user_id))).scalar_one() or 0
        total_vendor_accounts = db.execute(
            select(func.count(User.user_id)).where(User.role == "vendor")
        ).scalar_one() or 0
        total_bus_records = db.execute(select(func.count(Bus.bus_id))).scalar_one() or 0
        total_route_records = db.execute(select(func.count(Route.route_id))).scalar_one() or 0
        total_schedule_records = db.execute(select(func.count(BusSchedule.schedule_id))).scalar_one() or 0

    return {
        "total_users": total_users,
        "total_vendors": total_vendor_accounts,
        "total_buses": total_bus_records,
        "total_routes": total_route_records,
        "total_schedules": total_schedule_records,
        "total_bookings": len(bookings),
        "verified_vendors": len(verified_vendors),
        "pending_vendors": len(pending_vendors),
        "active_buses": len([item for item in buses if item.get("is_active", True)]),
        "active_routes": len([item for item in routes if item.get("is_active", True)]),
        "active_schedules": len([item for item in schedules if item.get("is_active", True)]),
        "total_booked_seats": total_booked_seats,
        "total_revenue": total_revenue,
    }
