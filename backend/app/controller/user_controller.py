from fastapi import APIRouter, HTTPException
from app.api.response import API
from app.model.schemas import UpdateUserProfileInput
from app.services.user_service import get_user_output, list_users_output, update_user_profile

router = APIRouter(
    responses={
        404: {"description": "Resource not found"},
    }
)


@router.get(
    "",
    summary="List users",
    description="Return all users with lightweight profile fields.",
)
def list_users():
    """List user accounts."""
    return list_users_output()


@router.get(
    "/{user_id}",
    summary="Get user by id",
    description="Return one user profile by numeric user id.",
    responses={404: {"description": "User not found"}},
)
def get_user(user_id: int):
    """Get user details.

    Example path:
    /api/users/12
    """
    user = get_user_output(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return API.success_with_data("User found", "user", user)


@router.put(
    "/{user_id}",
    summary="Update user profile",
    description="Update user name and phone number. Email cannot be changed after registration.",
    responses={
        400: {"description": "Invalid profile data"},
        404: {"description": "User not found"},
        409: {"description": "Phone number already in use"},
    },
)
def update_user_profile_endpoint(user_id: int, payload: UpdateUserProfileInput):
    """Update user profile.

    Example request body:
    {
        "name": "Updated Name",
        "phone": "+977-9841234567"
    }
    """
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    try:
        updated_user = update_user_profile(
            user_id=user_id,
            name=payload.name.strip(),
            phone=payload.phone,
        )
    except Exception as err:
        # Handle phone uniqueness constraint
        if "phone" in str(err).lower():
            raise HTTPException(status_code=409, detail="Phone number already in use")
        raise HTTPException(status_code=400, detail=str(err))

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return API.success_with_data("Profile updated successfully", "user", updated_user)
