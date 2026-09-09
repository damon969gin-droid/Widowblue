"""Funzioni di sicurezza: JWT, password hashing, 2FA con protezione avanzata"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import pyotp
import qrcode
from io import BytesIO
import base64
import secrets
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password in modo sicuro"""
    if not plain_password or not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password con bcrypt"""
    if not password:
        raise ValueError("Password cannot be empty")
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea JWT token con scadenza"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verifica e decode JWT token in modo sicuro"""
    if not token:
        return None
    
    try:
        # Rimuovi "Bearer " se presente
        if token.startswith("Bearer "):
            token = token[7:]
        
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError as e:
        return None

# === 2FA / TOTP ===
def generate_totp_secret() -> str:
    """Genera secret TOTP sicuro"""
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str) -> str:
    """Genera URI per QR code"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="Widow Blue")

def generate_qr_code(uri: str) -> str:
    """Genera QR code in base64"""
    try:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        raise ValueError(f"Error generating QR code: {str(e)}")

def verify_totp(secret: str, code: str, window: int = 1) -> bool:
    """Verifica codice TOTP con finestra di tolleranza"""
    if not secret or not code:
        return False
    
    try:
        totp = pyotp.TOTP(secret)
        # Accetta codici in una finestra di ±1 timestep
        return totp.verify(code, valid_window=window)
    except Exception:
        return False

# === Rate Limiting ===
failed_login_attempts = {}

def check_rate_limit(email: str, max_attempts: int = 5, window_seconds: int = 300) -> bool:
    """Controlla rate limiting per login"""
    now = datetime.utcnow().timestamp()
    
    if email not in failed_login_attempts:
        return True
    
    attempts = [t for t in failed_login_attempts[email] if now - t < window_seconds]
    failed_login_attempts[email] = attempts
    
    return len(attempts) < max_attempts

def record_failed_login(email: str):
    """Registra tentativo di login fallito"""
    if email not in failed_login_attempts:
        failed_login_attempts[email] = []
    failed_login_attempts[email].append(datetime.utcnow().timestamp())
