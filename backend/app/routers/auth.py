"""Authentication endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    TOTP2FASetup, TOTP2FAVerify, TOTP2FAVerifyResponse
)
from app.security import (
    verify_password, get_password_hash, create_access_token,
    generate_totp_secret, get_totp_uri, generate_qr_code, verify_totp
)

router = APIRouter()

def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Dipendenza per ottenere l'utente corrente dal token JWT"""
    from app.security import verify_token
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Registrazione nuovo utente"""
    # Verifica se utente esiste
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Crea utente
    new_user = User(
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Crea token
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=30)
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login utente"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30)
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(token: str, db: Session = Depends(get_db)):
    """Ottieni info utente corrente"""
    user = get_current_user(token, db)
    return user

# === 2FA / TOTP ===
@router.post("/2fa/setup", response_model=TOTP2FASetup)
def setup_2fa(token: str, db: Session = Depends(get_db)):
    """Configura 2FA con TOTP"""
    user = get_current_user(token, db)
    
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user.email)
    qr_code = generate_qr_code(uri)
    
    # Salva temporaneamente il secret (non ancora abilitato)
    user.totp_secret = secret
    db.commit()
    
    return TOTP2FASetup(
        secret=secret,
        qr_code_url=qr_code
    )

@router.post("/2fa/verify", response_model=TOTP2FAVerifyResponse)
def verify_2fa(token: str, verify_data: TOTP2FAVerify, db: Session = Depends(get_db)):
    """Verifica e abilita 2FA"""
    user = get_current_user(token, db)
    
    if not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not set up"
        )
    
    if not verify_totp(user.totp_secret, verify_data.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )
    
    # Abilita 2FA
    user.totp_enabled = True
    db.commit()
    
    return TOTP2FAVerifyResponse(
        success=True,
        message="2FA enabled successfully"
    )
