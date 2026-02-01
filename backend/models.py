from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Enums
class EquipmentStatus(str, Enum):
    available = "available"
    rented = "rented"
    maintenance = "maintenance"

class RentalStatus(str, Enum):
    draft = "draft"
    active = "active"
    closed = "closed"
    cancelled = "cancelled"

# Customer Models
class CustomerBase(BaseModel):
    full_name: str
    phone: str
    whatsapp_opt_in: bool = True
    email: Optional[str] = None
    national_id: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_opt_in: Optional[bool] = None
    email: Optional[str] = None
    national_id: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class Customer(CustomerBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

# Equipment Models
class EquipmentBase(BaseModel):
    name: str
    category: str
    serial_no: Optional[str] = None
    daily_rate: float
    status: EquipmentStatus = EquipmentStatus.available
    purchase_date: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    serial_no: Optional[str] = None
    daily_rate: Optional[float] = None
    status: Optional[EquipmentStatus] = None
    purchase_date: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

class Equipment(EquipmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

# Rental Contract Models
class RentalContractBase(BaseModel):
    customer_id: str
    equipment_id: str
    start_date: str
    end_date: Optional[str] = None
    deposit: float = 0.0
    notes: Optional[str] = None

class RentalContractCreate(RentalContractBase):
    pass

class RentalContractUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    deposit: Optional[float] = None
    actual_return_date: Optional[str] = None
    notes: Optional[str] = None

class RentalContract(RentalContractBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    contract_no: str
    daily_rate_snap: float
    status: RentalStatus
    actual_return_date: Optional[str] = None
    created_at: str

# Invoice Models
class InvoiceBase(BaseModel):
    contract_id: str
    subtotal: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total: float
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class InvoiceCreate(BaseModel):
    contract_id: str
    tax_rate: float = 0.0
    discount_amount: float = 0.0
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    paid: Optional[bool] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class Invoice(InvoiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    invoice_no: str
    issue_date: str
    paid: bool = False
    created_at: str

# Auth Models
class LoginRequest(BaseModel):
    phone: str

class VerifyOtpRequest(BaseModel):
    phone: str
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# User Role Enum
class UserRole(str, Enum):
    admin = "admin"           # صلاحيات كاملة
    employee = "employee"     # إدارة العقود والعملاء والمعدات
    accountant = "accountant" # عرض التقارير والفواتير فقط

# User Model (for authentication and authorization)
class UserBase(BaseModel):
    phone: str
    username: Optional[str] = None
    full_name: str
    role: UserRole = UserRole.employee
    email: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_id: Optional[str] = None
    is_manager: bool = False  # للتوافق مع النظام القديم
    created_at: str

# Employee Models
class EmployeeBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    national_id: Optional[str] = None
    position: str
    salary: Optional[float] = None
    hire_date: str
    is_active: bool = True
    notes: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    national_id: Optional[str] = None
    position: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class Employee(EmployeeBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

# Settings Models
class SettingsBase(BaseModel):
    header_logo: Optional[str] = None
    header_title: str = "نظام إدارة التأجير"
    header_subtitle: str = "Rental Management System"
    footer_text: str = "جميع الحقوق محفوظة © 2025"
    footer_phone: Optional[str] = None
    footer_email: Optional[str] = None
    footer_address: Optional[str] = None
    # Landing page content
    landing_title: Optional[str] = "نظام إدارة الإيجارات"
    landing_subtitle: Optional[str] = "حل متكامل لإدارة تأجير المعدات بكفاءة واحترافية"
    about_business: Optional[str] = None
    feature1_title: Optional[str] = "إدارة المعدات"
    feature1_description: Optional[str] = "نظام شامل لإدارة جميع معداتك وتتبع حالتها"
    feature2_title: Optional[str] = "إدارة العملاء"
    feature2_description: Optional[str] = "تنظيم بيانات العملاء ومتابعة عقودهم"
    feature3_title: Optional[str] = "تقارير متقدمة"
    feature3_description: Optional[str] = "احصل على رؤى شاملة عن أداء أعمالك"
    benefit1: Optional[str] = "سهولة في الاستخدام"
    benefit2: Optional[str] = "أمان وحماية البيانات"
    benefit3: Optional[str] = "إشعارات تلقائية"
    benefit4: Optional[str] = "دعم فني متواصل"
    # WhatsApp Config
    whatsapp_api_key: Optional[str] = None
    whatsapp_instance_id: Optional[str] = None

class SettingsUpdate(BaseModel):
    header_logo: Optional[str] = None
    header_title: Optional[str] = None
    header_subtitle: Optional[str] = None
    footer_text: Optional[str] = None
    footer_phone: Optional[str] = None
    footer_email: Optional[str] = None
    footer_address: Optional[str] = None
    landing_title: Optional[str] = None
    landing_subtitle: Optional[str] = None
    about_business: Optional[str] = None
    feature1_title: Optional[str] = None
    feature1_description: Optional[str] = None
    feature2_title: Optional[str] = None
    feature2_description: Optional[str] = None
    feature3_title: Optional[str] = None
    feature3_description: Optional[str] = None
    benefit1: Optional[str] = None
    benefit2: Optional[str] = None
    benefit3: Optional[str] = None
    benefit4: Optional[str] = None
    whatsapp_api_key: Optional[str] = None
    whatsapp_instance_id: Optional[str] = None

class Settings(SettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    updated_at: str