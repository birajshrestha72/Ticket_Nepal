from typing import Annotated

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile

from app.api.response import API
from app.config.firebase import verify_firebase_id_token
from app.model.schemas import (
    ForgotPasswordInput,
    GoogleLoginInput,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
)
from app.services.auth_service import (
    get_user_from_auth_token,
    login_or_create_firebase_user,
    login_user,
    issue_auth_token,
    resend_email_verification,
    register_vendor_with_document,
    reset_password,
    register_user,
    request_password_reset,
    verify_user_email,
)

router = APIRouter(
    responses={
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Resource not found"},
        503: {"description": "Service unavailable"},
    }
)


@router.post(
    "/register",
    summary="Register user account",
    description="Create a standard customer account. Vendor role is rejected here and must use /register-vendor.",
    responses={400: {"description": "Invalid registration request"}},
)
def register(payload: RegisterInput):
    """Register a non-vendor user.

    Example request body:
    {
        "name": "Biraj Shrestha",
        "email": "biraj@example.com",
        "password": "StrongPass123",
        "role": "customer"
    }
    """
    role = (payload.role or "").strip().lower()
    if role in {"vendor", "admin"}:
        raise HTTPException(
            status_code=400,
            detail="Vendor registration requires company registration document upload",
        )

    user = register_user(payload.name, payload.email, payload.password, payload.role)
    if user is None:
        raise HTTPException(status_code=400, detail="Email already used")

    return API.success_with_data(
        "Registration complete",
        "user",
        user,
    )


@router.post(
    "/register-vendor",
    summary="Register vendor with document",
    description="Create vendor account request with company registration document upload (multipart/form-data).",
    responses={400: {"description": "Invalid vendor registration request"}},
)
def register_vendor(
    name: Annotated[str, Form(...)],
    email: Annotated[str, Form(...)],
    password: Annotated[str, Form(...)],
    company_registration_document: Annotated[UploadFile, File(...)],
):
    """Register a vendor and upload company registration document.

    Multipart fields:
    - name
    - email
    - password
    - company_registration_document (file)
    """
    user, error = register_vendor_with_document(
        name=name,
        email=email,
        password=password,
        document_file=company_registration_document,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    return API.success_with_data(
        "Vendor registration submitted. Awaiting superadmin verification",
        "user",
        user,
    )


@router.post(
    "/login",
    summary="Login with email/password",
    description="Authenticate existing account and return user profile payload for session bootstrap.",
    responses={
        401: {"description": "Invalid credentials"},
        403: {"description": "Email not verified or account inactive"},
    },
)
def login(payload: LoginInput):
    """Login endpoint.

    Example request body:
    {
        "email": "biraj@example.com",
        "password": "StrongPass123"
    }
    """
    user, error_key = login_user(payload.email, payload.password)
    if user:
        response = API.success_with_data("Login success", "user", user)
        response["token"] = issue_auth_token(user)
        response["token_type"] = "Bearer"
        return response

    if error_key == "email_unverified":
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first.")
    if error_key == "inactive":
        raise HTTPException(status_code=403, detail="Your account is not active yet")

    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post(
    "/firebase-login",
    summary="Login with Firebase token",
    description="Verify Firebase ID token, then login or auto-create user account.",
    responses={
        400: {"description": "Missing Firebase token claims"},
        401: {"description": "Invalid Firebase token"},
        403: {"description": "Email not verified"},
        503: {"description": "Firebase auth service unavailable"},
    },
)
def firebase_login(payload: GoogleLoginInput):
    """Firebase token login.

    Example request body:
    {
        "id_token": "<firebase-id-token>"
    }
    """
    try:
        decoded = verify_firebase_id_token(payload.id_token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc

    firebase_uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name")
    provider = (decoded.get("firebase") or {}).get("sign_in_provider")
    email_verified = bool(decoded.get("email_verified"))

    if not firebase_uid or not email:
        raise HTTPException(status_code=400, detail="Firebase token missing required claims")
    if not email_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first.")

    user = login_or_create_firebase_user(
        firebase_uid=firebase_uid,
        email=email,
        name=name,
        auth_provider=provider,
    )
    response = API.success_with_data("Firebase login success", "user", user)
    response["token"] = issue_auth_token(user)
    response["token_type"] = "Bearer"
    return response


@router.post(
    "/google-login",
    summary="Google login alias",
    description="Backward-compatible alias for /firebase-login.",
    responses={
        400: {"description": "Missing Google token claims"},
        401: {"description": "Invalid Google token"},
        403: {"description": "Email not verified"},
        503: {"description": "Google auth service unavailable"},
    },
)
def google_login(payload: GoogleLoginInput):
    # Backward-compatible alias for older clients.
    return firebase_login(payload)


@router.get(
    "/me",
    summary="Get authenticated user",
    description="Return the current user resolved from a Bearer JWT access token.",
    responses={
        401: {"description": "Missing or invalid bearer token"},
        403: {"description": "Account is inactive"},
        404: {"description": "User not found"},
    },
)
def me(authorization: Annotated[str | None, Header()] = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authorization token")

    user, error_key = get_user_from_auth_token(token.strip())
    if error_key == "expired":
        raise HTTPException(status_code=401, detail="Session expired. Please login again.")
    if error_key in {"invalid", "user"}:
        raise HTTPException(status_code=401, detail="Invalid authorization token")
    if error_key == "inactive":
        raise HTTPException(status_code=403, detail="Your account is not active yet")

    return API.success_with_data("Authenticated user", "user", user)


@router.post(
    "/forgot-password",
    summary="Request password reset",
    description="Send password reset instructions (always returns generic success message).",
)
def forgot_password(payload: ForgotPasswordInput):
    # Return generic success message in all cases to avoid email enumeration.
    request_password_reset(payload.email)
    return API.success(
        "If the email exists, password reset instructions have been sent"
    )


@router.get(
    "/verify-email",
    summary="Verify email token",
    description="Validate verification token and activate email verification state.",
    responses={
        400: {"description": "Invalid or expired verification token"},
        404: {"description": "User not found"},
    },
)
def verify_email(token: str):
    """Email verification endpoint.

    Example query:
    /api/auth/verify-email?token=<verification-token>
    """
    user, error_key = verify_user_email(token)
    if error_key in {"invalid", "expired"}:
        raise HTTPException(status_code=400, detail="Verification link is invalid or expired")
    if error_key == "user":
        raise HTTPException(status_code=404, detail="User not found")

    return API.success_with_data("Email verified successfully", "user", user)


@router.post(
    "/verify-email/resend",
    summary="Resend verification email",
    description="Resend account verification link to the provided email if account exists.",
)
def resend_verify_email(payload: ForgotPasswordInput):
    resend_email_verification(payload.email)
    return API.success("If the email exists, a verification link has been sent")


@router.post(
    "/reset-password",
    summary="Reset password",
    description="Reset user password using email and new password.",
    responses={
        400: {"description": "Invalid password"},
        404: {"description": "User not found"},
    },
)
def reset_password_handler(payload: ResetPasswordInput):
    """Reset password endpoint.

    Example request body:
    {
        "email": "biraj@example.com",
        "new_password": "NewStrongPass123"
    }
    """
    if len(payload.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    updated = reset_password(payload.email, payload.new_password)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")

    return API.success("Password has been reset successfully")
