"""
Dependencies - FastAPI dependency injection
Authentication and authorization dependencies with Firebase support
"""

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.core.security import decode_access_token, verify_token
from app.core.exceptions import UnauthorizedException, ForbiddenException


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user from JWT or Firebase token
    Supports both Firebase authentication and legacy JWT
    """
    token = credentials.credentials
    
    # Try Firebase token first, then fall back to JWT
    payload = await verify_token(token)
    
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")
    
    # Extract user info from token
    email = payload.get("email")
    role = payload.get("role", "customer")  # Default to customer if role not in token
    
    if not email:
        raise UnauthorizedException("Invalid token payload")
    
    return {
        "id": payload.get("id"),  # JWT token has id (integer), Firebase token won't have this
        "uid": payload.get("uid"),  # Firebase token has uid (string), JWT token won't have this
        "email": email,
        "role": role,
        "firebase": payload.get("firebase", False)
    }


async def get_current_user_from_header(
    authorization: str = Header(None)
) -> dict:
    """
    Alternative method to get current user from Authorization header
    Useful for routes that need manual header handling
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    payload = await verify_token(token)
    
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")
    
    email = payload.get("email")
    role = payload.get("role", "customer")
    
    if not email:
        raise UnauthorizedException("Invalid token payload")
    
    return {
        "id": payload.get("id"),  # JWT token has id (integer), Firebase token won't have this
        "uid": payload.get("uid"),  # Firebase token has uid (string), JWT token won't have this
        "email": email,
        "role": role,
        "firebase": payload.get("firebase", False)
    }


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Get current user if token provided, else None
    Optional authentication dependency
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except:
        return None


def require_role(*allowed_roles: str):
    """
    Dependency factory: Specific roles ko lagi access restrict garcha
    Usage: dependencies=[Depends(require_role("admin", "vendor"))]
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        
        if user_role not in allowed_roles:
            raise ForbiddenException(
                f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker
