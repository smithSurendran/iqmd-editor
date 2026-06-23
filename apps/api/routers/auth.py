from fastapi import APIRouter, Depends, HTTPException, Response, status, Cookie
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from core.deps import get_current_user
from core.config import settings
from services.auth_service import (
    authenticate_user, create_access_token, create_refresh_token,
    decode_token, get_user_by_id, get_user_by_email, hash_password
)
from schemas.auth import (
    LoginRequest, TokenResponse, UserInfo, RefreshResponse,
    PasswordResetRequest, PasswordResetConfirm, MessageResponse, SuccessResponse
)
from models.user import User
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    payload = {"sub": str(user.id), "role": user.role.value, "email": user.email}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False,  # Set True in production (HTTPS)
    )
    
    return TokenResponse(access_token=access_token, user=UserInfo.model_validate(user))

@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(refresh_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user = get_user_by_id(db, payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    
    new_payload = {"sub": user.id, "role": user.role.value, "email": user.email}
    return RefreshResponse(access_token=create_access_token(new_payload))

@router.post("/logout", response_model=SuccessResponse)
def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return SuccessResponse()

@router.post("/reset-request", response_model=MessageResponse)
def reset_request(body: PasswordResetRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    # Always return same message — prevents user enumeration
    if user:
        # In production: send email with token. For now, log it.
        token = create_access_token({"sub": user.id, "purpose": "reset"})
        print(f"\n🔑 PASSWORD RESET TOKEN for {user.email}:\n{token}\n")
    return MessageResponse(message="If that email exists, a reset link has been sent.")

@router.post("/reset", response_model=SuccessResponse)
def reset_password(body: PasswordResetConfirm, db: Session = Depends(get_db)):
    payload = decode_token(body.token)
    if not payload or payload.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = get_user_by_id(db, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    user.password_hash = hash_password(body.new_password)
    db.commit()
    return SuccessResponse()


@router.get("/me", response_model=UserInfo)
def me(current_user: User = Depends(get_current_user)):
    return UserInfo.model_validate(current_user)