"""
Security utilities - Password hashing, JWT tokens, and Firebase authentication
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config.settings import settings
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize Firebase Admin SDK
firebase_initialized = False

def initialize_firebase():
    """
    Initialize Firebase Admin SDK
    """
    global firebase_initialized
    
    if firebase_initialized:
        return
    
    try:
        # Try to use service account credentials file
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')
        
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK initialized with service account")
        else:
            # Initialize with default credentials (for production)
            firebase_admin.initialize_app()
            print("✅ Firebase Admin SDK initialized with default credentials")
        
        firebase_initialized = True
    except Exception as e:
        print(f"⚠️  Firebase Admin SDK initialization failed: {e}")
        print("   Firebase authentication will not be available")


# Initialize Firebase on module load
initialize_firebase()


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt
    Args:
        password: Plain text password
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
    Returns:
        True if password matches
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    Args:
        data: Data to encode in token (user_id, email, role)
        expires_delta: Optional custom expiration time
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict]:
    """
    Decode and verify JWT token
    Args:
        token: JWT token string
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None


async def verify_firebase_token(token: str) -> Optional[Dict]:
    """
    Verify Firebase ID token
    Args:
        token: Firebase ID token from client
    Returns:
        Decoded token payload with user info or None if invalid
    """
    if not firebase_initialized:
        print("⚠️  Firebase not initialized, cannot verify token")
        return None
    
    try:
        # Verify the token with Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(token)
        
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "email_verified": decoded_token.get("email_verified", False),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "firebase": True
        }
    except firebase_auth.InvalidIdTokenError as e:
        print(f"Invalid Firebase token: {e}")
        return None
    except firebase_auth.ExpiredIdTokenError as e:
        print(f"Expired Firebase token: {e}")
        return None
    except Exception as e:
        print(f"Firebase token verification error: {e}")
        return None


async def verify_token(token: str) -> Optional[Dict]:
    """
    Verify token - tries Firebase first, then falls back to JWT
    Args:
        token: Token string (Firebase ID token or JWT)
    Returns:
        Decoded token payload or None if invalid
    """
    # Try Firebase token first
    firebase_result = await verify_firebase_token(token)
    if firebase_result:
        return firebase_result
    
    # Fall back to JWT token
    jwt_result = decode_access_token(token)
    if jwt_result:
        return {**jwt_result, "firebase": False}
    
    return None
