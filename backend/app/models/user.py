"""
User Models - Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re


class UserRegister(BaseModel):
    """User registration request"""
    name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: str = Field(default="customer")
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['customer', 'vendor']:
            raise ValueError('Role must be customer or vendor')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            # Nepal phone number: 10 digits starting with 9
            if not re.match(r'^9\d{9}$', v):
                raise ValueError('Invalid Nepal phone number (Must start with 9 and be 10 digits)')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Ram Bahadur Thapa",
                "email": "ram@example.com",
                "phone": "9801234567",
                "password": "password123",
                "role": "customer"
            }
        }


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "ram@example.com",
                "password": "password123"
            }
        }


class GoogleAuthRequest(BaseModel):
    """Google OAuth request"""
    idToken: str = Field(..., alias="idToken")
    role: str = Field(default="customer")
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['customer', 'vendor']:
            raise ValueError('Role must be customer or vendor')
        return v
    
    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """User response model"""
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    auth_provider: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """User profile update request"""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    phone: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and v != "":
            if not re.match(r'^9\d{9}$', v):
                raise ValueError('Invalid Nepal phone number')
        return v


class AuthResponse(BaseModel):
    """Authentication response with token"""
    status: str = "success"
    message: str
    data: dict
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Login successful",
                "data": {
                    "user": {
                        "id": 1,
                        "name": "Ram Bahadur Thapa",
                        "email": "ram@example.com",
                        "role": "customer"
                    },
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                }
            }
        }
