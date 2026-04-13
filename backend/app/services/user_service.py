from sqlalchemy import select

from app.config.database import get_session
from app.model.models import User


def _to_user_output(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
            "phone": user.phone,
        "role": user.role,
    }


def list_users_output():
    with get_session() as db:
        users = db.execute(select(User).order_by(User.user_id)).scalars().all()
        return [_to_user_output(user) for user in users]


def find_user(user_id: int):
    with get_session() as db:
        user = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        if user is None:
            return None
        return _to_user_output(user)


def get_user_output(user_id: int):
    return find_user(user_id)


def update_user_profile(user_id: int, name: str, phone: str | None = None) -> dict | None:
    """Update user profile (name and phone only). Email cannot be changed."""
    with get_session() as db:
        user = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        if not user:
            return None

        # Update name
        if name and name.strip():
            user.name = name.strip()

        # Update phone if provided
        if phone is not None:
            user.phone = phone.strip() if phone.strip() else None

        db.commit()
        db.refresh(user)
        return _to_user_output(user)
