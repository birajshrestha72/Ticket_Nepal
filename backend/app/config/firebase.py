"""
Firebase Configuration - Google OAuth verification
Firebase Admin SDK use garera ID tokens verify garcha
"""

import firebase_admin
from firebase_admin import credentials, auth
from typing import Optional, Dict
from .settings import settings


# Firebase app instance
firebase_app: Optional[firebase_admin.App] = None


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global firebase_app
    
    try:
        # Check if credentials are provided
        if not all([
            settings.FIREBASE_PROJECT_ID,
            settings.FIREBASE_PRIVATE_KEY,
            settings.FIREBASE_CLIENT_EMAIL
        ]):
            print("⚠️  Firebase credentials not configured. Google OAuth will not work.")
            return None
        
        # Create credential object
        cred_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n') if settings.FIREBASE_PRIVATE_KEY else None,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
        }
        
        cred = credentials.Certificate(cred_dict)
        firebase_app = firebase_admin.initialize_app(cred)
        
        print("✅ Firebase Admin initialized")
        return firebase_app
        
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        return None


async def verify_firebase_token(id_token: str) -> Dict:
    """
    Verify Firebase ID token
    Args:
        id_token: Firebase ID token from frontend
    Returns:
        Dict with user info (uid, email, name, picture)
    Raises:
        Exception if token invalid
    """
    try:
        if not firebase_app:
            initialize_firebase()
        
        if not firebase_app:
            raise Exception("Firebase not initialized")
        
        # Verify token
        decoded_token = auth.verify_id_token(id_token)
        
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "email_verified": decoded_token.get("email_verified", False)
        }
        
    except Exception as e:
        print(f"❌ Token verification error: {e}")
        raise Exception(f"Invalid Firebase token: {str(e)}")


# Initialize on module load
initialize_firebase()
