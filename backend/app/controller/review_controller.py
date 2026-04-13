from fastapi import APIRouter, HTTPException

from app.api.response import API
from app.model.schemas import CreateReviewInput
from app.services.review_service import create_review, list_reviews_by_user

router = APIRouter(
    responses={
        400: {"description": "Bad request"},
        403: {"description": "Forbidden"},
        404: {"description": "Resource not found"},
        409: {"description": "Conflict"},
    }
)


@router.get(
    "",
    summary="List user reviews",
    description="Return reviews submitted by a specific user.",
)
def list_reviews(user_id: int):
    """List reviews by user id.

    Example query:
    /api/reviews?user_id=12
    """
    return API.success_with_data("Reviews loaded", "reviews", list_reviews_by_user(user_id))


@router.post(
    "",
    summary="Submit review",
    description="Submit one review for a completed booking (one review per booking).",
    responses={
        400: {"description": "Review not yet allowed"},
        403: {"description": "Forbidden review attempt"},
        404: {"description": "Booking not found"},
        409: {"description": "Duplicate review"},
    },
)
def submit_review(payload: CreateReviewInput):
    """Create booking review.

    Example request body:
    {
        "user_id": 12,
        "booking_id": 88,
        "rating": 5,
        "review_text": "Great service"
    }
    """
    review, error_key = create_review(
        user_id=payload.user_id,
        booking_id=payload.booking_id,
        rating=payload.rating,
        review_text=payload.review_text,
    )

    if error_key == "booking":
        raise HTTPException(status_code=404, detail="Booking not found")
    if error_key == "forbidden":
        raise HTTPException(status_code=403, detail="You cannot review this booking")
    if error_key == "duplicate":
        raise HTTPException(status_code=409, detail="Review already submitted for this booking")
    if error_key == "too_early":
        raise HTTPException(status_code=400, detail="Review is available 24 hours after journey start")

    return API.success_with_data("Review submitted", "review", review)
