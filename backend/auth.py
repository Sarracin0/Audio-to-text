"""
Sistema di autenticazione per proteggere le API
"""

import os
import hashlib
import secrets
from typing import Optional
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import jwt
from dotenv import load_dotenv

load_dotenv()

# Configurazione
SECRET_KEY = os.getenv('AUTH_SECRET_KEY', secrets.token_urlsafe(32))
APP_PASSWORD = os.getenv('APP_PASSWORD')  # Password per accedere all'app
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security scheme per Swagger UI
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash della password con SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict) -> str:
    """Crea un JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verifica e decodifica il JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token scaduto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token_data: dict = Depends(verify_token)) -> dict:
    """Ottieni l'utente corrente dal token"""
    if not token_data.get("authenticated"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autenticato"
        )
    return {"authenticated": True, "login_time": token_data.get("login_time")}

def verify_password(password: str) -> bool:
    """Verifica se la password è corretta"""
    if not APP_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password app non configurata. Imposta APP_PASSWORD nelle variabili d'ambiente."
        )
    
    return hash_password(password) == hash_password(APP_PASSWORD)