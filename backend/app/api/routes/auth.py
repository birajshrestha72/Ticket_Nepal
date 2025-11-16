"""
Authentication Routes - Login, Register, Google OAuth endpoints
FastAPI router with async handlers
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict

from app.models.user import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    UserResponse,
    UserUpdate,
    AuthResponse
)
from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    ForbiddenException
)
from app.config.database import database
from app.config.firebase import verify_firebase_token


router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register new user with email/password
    Naya user ko account banaucha
    """
    # Check if email already exists
    existing_user = await database.fetch_one(
        "SELECT user_id FROM users WHERE email = $1",
        user_data.email
    )
    
    if existing_user:
        raise ConflictException("Email already registered (Yo email pahile nai register cha)")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Insert new user
    user = await database.fetch_one(
        """
        INSERT INTO users (name, email, phone, password_hash, role, auth_provider, is_active)
        VALUES ($1, $2, $3, $4, $5, 'email', true)
        RETURNING user_id, name, email, phone, role, created_at
        """,
        user_data.name,
        user_data.email,
        user_data.phone,
        hashed_password,
        user_data.role
    )
    
    # Generate JWT token
    token = create_access_token({
        "id": user["user_id"],
        "email": user["email"],
        "role": user["role"]
    })
    
    return {
        "status": "success",
        "message": "Registration successful (Safalta purvak darta bhayo)",
        "data": {
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"],
                "created_at": user["created_at"].isoformat() if user["created_at"] else None
            },
            "token": token
        }
    }


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """
    Login with email/password
    Email ra password le login garcha
    """
    # Find user by email
    user = await database.fetch_one(
        """
        SELECT user_id, name, email, phone, password_hash, role, is_active, auth_provider
        FROM users WHERE email = $1
        """,
        credentials.email
    )
    
    if not user:
        raise UnauthorizedException("Invalid email or password (Email ya password milena)")
    
    # Check if account is active
    if not user["is_active"]:
        raise ForbiddenException("Account is deactivated. Contact support.")
    
    # Check auth provider
    if user["auth_provider"] != "email":
        raise BadRequestException(f"Please login with {user['auth_provider']}")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise UnauthorizedException("Invalid email or password (Email ya password milena)")
    
    # Update last login
    await database.execute(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
        user["user_id"]
    )
    
    # Generate token
    token = create_access_token({
        "id": user["user_id"],
        "email": user["email"],
        "role": user["role"]
    })
    
    return {
        "status": "success",
        "message": "Login successful (Safalta purvak login bhayo)",
        "data": {
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"]
            },
            "token": token
        }
    }


@router.post("/google", response_model=AuthResponse)
async def google_auth(auth_data: GoogleAuthRequest):
    """
    Google OAuth login/register
    Google bata login garcha
    """
    # Verify Firebase token
    try:
        firebase_user = await verify_firebase_token(auth_data.idToken)
    except Exception as e:
        raise UnauthorizedException(f"Invalid Google token: {str(e)}")
    
    email = firebase_user.get("email")
    name = firebase_user.get("name", email.split("@")[0])
    uid = firebase_user.get("uid")
    
    if not email:
        raise BadRequestException("Email not provided by Google")
    
    # Check if user exists
    user = await database.fetch_one(
        "SELECT user_id, name, email, phone, role, is_active FROM users WHERE email = $1",
        email
    )
    
    if user:
        # Existing user - login
        if not user["is_active"]:
            raise ForbiddenException("Account is deactivated")
        
        # Update last login
        await database.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
            user["user_id"]
        )
    else:
        # New user - register
        user = await database.fetch_one(
            """
            INSERT INTO users (name, email, role, auth_provider, firebase_uid, is_active)
            VALUES ($1, $2, $3, 'google', $4, true)
            RETURNING user_id, name, email, phone, role, created_at
            """,
            name,
            email,
            auth_data.role,
            uid
        )
    
    # Generate token
    token = create_access_token({
        "id": user["user_id"],
        "email": user["email"],
        "role": user["role"]
    })
    
    return {
        "status": "success",
        "message": "Google authentication successful",
        "data": {
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"]
            },
            "token": token
        }
    }


@router.get("/me", response_model=Dict)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile
    Login bhayeko user ko details dekhaucha
    """
    user = await database.fetch_one(
        """
        SELECT user_id, name, email, phone, role, auth_provider, created_at, last_login
        FROM users WHERE user_id = $1
        """,
        current_user["id"]
    )
    
    if not user:
        raise NotFoundException("User not found")
    
    return {
        "status": "success",
        "data": {
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"],
                "auth_provider": user["auth_provider"],
                "created_at": user["created_at"].isoformat() if user["created_at"] else None,
                "last_login": user["last_login"].isoformat() if user["last_login"] else None
            }
        }
    }


@router.put("/profile", response_model=Dict)
async def update_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile
    User ko profile update garcha (name, phone)
    """
    # Build dynamic update query
    updates = []
    values = []
    param_count = 1
    
    if update_data.name:
        updates.append(f"name = ${param_count}")
        values.append(update_data.name)
        param_count += 1
    
    if update_data.phone:
        updates.append(f"phone = ${param_count}")
        values.append(update_data.phone)
        param_count += 1
    
    if not updates:
        raise BadRequestException("No fields to update")
    
    # Add updated_at
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    # Add user_id for WHERE clause
    values.append(current_user["id"])
    
    # Execute update
    user = await database.fetch_one(
        f"""
        UPDATE users 
        SET {', '.join(updates)}
        WHERE user_id = ${param_count}
        RETURNING user_id, name, email, phone, role
        """,
        *values
    )
    
    return {
        "status": "success",
        "message": "Profile updated successfully",
        "data": {
            "user": {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "phone": user["phone"],
                "role": user["role"]
            }
        }
    }
