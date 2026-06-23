from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .config import settings
from services.auth_service import decode_token, get_user_by_id
from models.user import User, UserRole


bearer = HTTPBearer(auto_error=False)

def get_current_user(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
        db: Session = Depends(get_db)
) -> User:
    exe = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise exe
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise exe
    
    user = get_user_by_id(db, payload.get("sub"))
    if not user or not user.is_active:
        raise exe
    return user

def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker

# Covenience shortcuts
require_physician = require_role(UserRole.physician, UserRole.admin)
require_admin = require_role(UserRole.admin)


