from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
import jwt
import os
from models import UserRole

security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """استخراج بيانات المستخدم من JWT Token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def require_roles(allowed_roles: List[UserRole]):
    """Decorator للتحقق من صلاحيات المستخدم"""
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "employee")
        
        # Admin له صلاحيات على كل شيء
        if user_role == UserRole.admin.value:
            return current_user
        
        # التحقق من أن دور المستخدم في القائمة المسموحة
        if user_role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
            )
        
        return current_user
    
    return role_checker

# Shortcuts للأدوار الشائعة
def require_admin(current_user: dict = Depends(get_current_user)):
    """يتطلب صلاحية Admin"""
    return require_roles([UserRole.admin])(current_user)

def require_admin_or_employee(current_user: dict = Depends(get_current_user)):
    """يتطلب صلاحية Admin أو Employee"""
    return require_roles([UserRole.admin, UserRole.employee])(current_user)

def require_any_role(current_user: dict = Depends(get_current_user)):
    """يتطلب أي مستخدم مسجل دخول"""
    return current_user
