"""
Firebase Authentication Routes
Handles user synchronization and profile management with Firebase
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.config.database import database
from app.core.security import verify_firebase_token, verify_token
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserSyncRequest(BaseModel):
    uid: str
    email: EmailStr
    display_name: Optional[str] = None
    role: Optional[str] = "customer"


class UserResponse(BaseModel):
    user_id: int
    uid: str
    email: str
    display_name: Optional[str]
    role: str
    created_at: datetime
    last_login: datetime


async def get_current_user(authorization: str = Header(None)):
    """
    Dependency to get current authenticated user
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    # Verify token (Firebase or JWT)
    payload = await verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/sync")
async def sync_user_with_backend(
    request: UserSyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Sync Firebase user with backend database
    Creates or updates user record in PostgreSQL
    
    This endpoint should be called after successful Firebase authentication
    to ensure user exists in our database
    """
    try:
        # Check if user already exists
        existing_user = await database.fetch_one("""
            SELECT user_id, firebase_uid, email, name, role, created_at
            FROM users
            WHERE firebase_uid = $1 OR email = $2
        """, request.uid, request.email)
            
        if existing_user:
            # Update existing user
            updated_user = await database.fetch_one("""
                UPDATE users
                SET 
                    name = COALESCE($1, name),
                    last_login = NOW(),
                    updated_at = NOW()
                WHERE firebase_uid = $2 OR email = $3
                RETURNING user_id, firebase_uid, email, name, role, created_at, last_login
            """, request.display_name, request.uid, request.email)
                
            return {
                "status": "success",
                "message": "User updated successfully",
                "data": {
                    "user_id": updated_user["user_id"],
                    "uid": updated_user["firebase_uid"],
                    "email": updated_user["email"],
                    "display_name": updated_user["name"],
                    "role": updated_user["role"],
                    "created_at": updated_user["created_at"],
                    "last_login": updated_user["last_login"]
                }
            }
        else:
            # Create new user
            new_user = await database.fetch_one("""
                INSERT INTO users (firebase_uid, email, name, role, auth_provider, created_at, updated_at, last_login)
                VALUES ($1, $2, $3, $4, 'google', NOW(), NOW(), NOW())
                RETURNING user_id, firebase_uid, email, name, role, created_at, last_login
            """, request.uid, request.email, request.display_name, request.role)
                
            return {
                "status": "success",
                "message": "User created successfully",
                "data": {
                    "user_id": new_user["user_id"],
                    "uid": new_user["firebase_uid"],
                    "email": new_user["email"],
                    "display_name": new_user["name"],
                    "role": new_user["role"],
                    "created_at": new_user["created_at"],
                    "last_login": new_user["last_login"]
                }
            }
    
    except Exception as e:
        print(f"Error syncing user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync user: {str(e)}")


@router.get("/me")
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current authenticated user's profile
    Returns user information from database
    """
    try:
        # Handle both Firebase tokens (uid) and JWT tokens (id)
        uid = current_user.get("uid")
        user_id = current_user.get("id")
        email = current_user.get("email")
        
        if not uid and not user_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Fetch user from database
        if user_id:
            # JWT token - use user_id
            user = await database.fetch_one("""
                SELECT 
                    user_id, 
                    firebase_uid, 
                    email, 
                    name,
                    role, 
                    phone,
                    is_active,
                    email_verified,
                    created_at,
                    last_login
                FROM users
                WHERE user_id = $1
            """, user_id)
        else:
            # Firebase token - use firebase_uid or email
            user = await database.fetch_one("""
                SELECT 
                    user_id, 
                    firebase_uid, 
                    email, 
                    name,
                    role, 
                    phone,
                    is_active,
                    email_verified,
                    created_at,
                    last_login
                FROM users
                WHERE firebase_uid = $1 OR email = $2
            """, uid, email)
            
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database")
        
        return {
            "status": "success",
            "data": {
                "user_id": user["user_id"],
                "uid": user["firebase_uid"],
                "email": user["email"],
                "display_name": user["name"],
                "role": user["role"],
                "phone_number": user["phone"],
                "is_active": user["is_active"],
                "email_verified": user["email_verified"],
                "created_at": user["created_at"],
                "last_login": user["last_login"]
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")


@router.put("/profile")
async def update_user_profile(
    display_name: Optional[str] = None,
    phone_number: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile
    """
    try:
        # Handle both Firebase tokens (uid) and JWT tokens (id)
        uid = current_user.get("uid")
        user_id = current_user.get("id")
        email = current_user.get("email")
        
        if not uid and not user_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        # Build dynamic update query
        update_fields = []
        params = []
        param_count = 1
        
        if display_name is not None:
            update_fields.append(f"name = ${param_count}")
            params.append(display_name)
            param_count += 1
        
        if phone_number is not None:
            update_fields.append(f"phone = ${param_count}")
            params.append(phone_number)
            param_count += 1
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append(f"updated_at = NOW()")
        
        # Build WHERE clause based on token type
        if user_id:
            where_clause = f"user_id = ${param_count}"
            params.append(user_id)
        else:
            where_clause = f"(uid = ${param_count} OR email = ${param_count + 1})"
            params.extend([uid, email])
        
        query = f"""
            UPDATE users
            SET {', '.join(update_fields)}
            WHERE {where_clause}
            RETURNING user_id, uid, email, name as display_name, phone as phone_number, role
        """
        
        updated_user = await database.fetch_one(query, *params)
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "data": {
                "user_id": updated_user["user_id"],
                "uid": updated_user["uid"],
                "email": updated_user["email"],
                "display_name": updated_user["display_name"],
                "phone_number": updated_user["phone_number"],
                "role": updated_user["role"]
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


@router.post("/verify-token")
async def verify_user_token(authorization: str = Header(None)):
    """
    Verify Firebase token validity
    Useful for checking if user is still authenticated
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    payload = await verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "status": "success",
        "message": "Token is valid",
        "data": {
            "uid": payload.get("uid"),
            "email": payload.get("email"),
            "firebase": payload.get("firebase", False)
        }
    }
