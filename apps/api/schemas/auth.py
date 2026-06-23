from pydantic import BaseModel, EmailStr
from models.user import UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserInfo(BaseModel):
    id: str
    email: str
    role: UserRole
    first_name: str
    last_name: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    user: UserInfo
    token_type: str = "bearer"

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class MessageResponse(BaseModel):
    message: str

class SuccessResponse(BaseModel):
    success: bool = True
