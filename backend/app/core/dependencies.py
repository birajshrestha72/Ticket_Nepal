"""
Dependencies - FastAPI dependency injection
Authentication ra authorization dependencies
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user from JWT token
    Dependency injection: Routes ma use garna milcha
    """
    token = credentials.credentials
    
    payload = decode_access_token(token)
    
    if payload is None:
        raise UnauthorizedException("Invalid or expired token")
    
    # Extract user info from token
    user_id = payload.get("id")
    email = payload.get("email")
    role = payload.get("role")
    
    if not user_id or not email:
        raise UnauthorizedException("Invalid token payload")
    
    return {
        "id": user_id,
        "email": email,
        "role": role
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
