"""Pydantic schemas per validazione e serializzazione"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# === Auth Schemas ===
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str

class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str]
    totp_enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# === 2FA Schemas ===
class TOTP2FASetup(BaseModel):
    secret: str
    qr_code_url: str

class TOTP2FAVerify(BaseModel):
    code: str

class TOTP2FAVerifyResponse(BaseModel):
    success: bool
    message: str

# === Contact Schemas ===
class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    is_group: bool = False
    color: str = "#7C3AED"
    initials: Optional[str] = None

class ContactResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    is_group: bool
    color: str
    initials: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContactsAddBatch(BaseModel):
    contacts: List[ContactCreate]

# === Message Schemas ===
class MessageCreate(BaseModel):
    text: str

class MessageResponse(BaseModel):
    id: int
    from_user_id: int
    to_contact_id: str
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# === Reward Schemas ===
class RewardSubmit(BaseModel):
    steps: int

class RewardResponse(BaseModel):
    id: int
    user_id: int
    wblu_awarded: float
    day: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# === Health Check ===
class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
