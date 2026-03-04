# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a bilingual (Arabic/English) Rental Management System with separate customer portal and staff dashboard. It consists of a FastAPI backend with MongoDB and a React 19 frontend using shadcn/ui components.

## Development Commands

### Start Development Environment
```powershell
# Terminal 1 - Backend (FastAPI on port 8001)
cd backend
.\venv\Scripts\activate  # Or use .\start.ps1
uvicorn server:app --host 127.0.0.1 --port 8001 --reload

# Terminal 2 - Frontend (React on port 3000)
cd frontend
yarn start  # Or use .\start.ps1

# MongoDB should be running on localhost:27017
```

### Database Operations
```powershell
# Seed sample data (includes admin user)
cd backend
python seed_data.py

# MongoDB connection
# Local: mongodb://localhost:27017
# Database: rental_management
```

### Build & Testing
```powershell
# Frontend production build
cd frontend
yarn build

# Backend API docs (auto-generated)
# Visit: http://127.0.0.1:8001/docs
```

## Architecture

### Backend Structure
- **FastAPI application** with async/await throughout
- **Layered architecture**: routers → services → models → database
- **Authentication**: Dual system - OTP via WhatsApp for customers, username/password for staff
- **Authorization**: JWT-based with role middleware decorators (`require_admin()`, `require_admin_or_employee()`)
- **Models**: Pydantic v2 with separate Create/Update/Response schemas
- **API prefix**: All endpoints under `/api`

### Frontend Structure
- **React 19** with functional components and hooks
- **Routing**: Protected routes with role-based redirection (StaffRoute, CustomerRoute)
- **UI Components**: shadcn/ui library (40+ Radix UI components with Tailwind)
- **State**: AuthContext for global auth state, localStorage for persistence
- **API Client**: Axios with interceptors for automatic token attachment and 401 handling
- **RTL Support**: Full Arabic UI with right-to-left layout

### Key Design Patterns
- **RBAC**: Four roles - admin, employee, accountant, customer
- **Customer Portal Separation**: Customers have dedicated portal at `/customer-portal/*`
- **Staff Dashboard**: Admin/Employee/Accountant share dashboard with role-based features
- **Automatic Customer Registration**: Customers auto-register on first OTP login if phone exists in database

## Critical Business Logic

### Rental Contract Workflow
1. Create rental contract → Status: "active"
2. Equipment status changes → "rented"
3. Contract closure triggers:
   - Invoice auto-generation with tax/discount calculation
   - Late fee calculation based on return date
   - Equipment status reset to "available"
   - WhatsApp notification to customer

### Authentication Flow
- **Customers**: Phone → OTP via WhatsApp → JWT token (30 days)
- **Staff**: Username/password → JWT token → Role-based routing
- **Token includes**: user_id, phone, role, customer_id, is_manager flags

### WhatsApp Integration
- TextMeBot API for OTP and notifications
- Configurable via Settings page (API token, instance ID)
- Notification types: OTP, rental activation, invoice, reminders

## Database Collections

- **users**: System users with roles and auth data
- **customers**: Customer information and contact details
- **equipment**: Rental equipment catalog with status tracking
- **rental_contracts**: Active/closed rental agreements
- **invoices**: Auto-generated billing records
- **employees**: Employee records with manager flag
- **settings**: Singleton document for app configuration

## Important Files & Their Purposes

### Backend
- `backend/middleware/permissions.py`: Role-based access control decorators
- `backend/services/notification_service.py`: WhatsApp messaging
- `backend/services/export_service.py`: PDF/Excel generation with Arabic support
- `backend/routers/quick_rental.py`: QR code-based quick actions
- `backend/seed_data.py`: Sample data including admin user

### Frontend
- `frontend/src/context/AuthContext.js`: Global authentication state
- `frontend/src/App.js`: Route definitions and role-based routing
- `frontend/src/pages/CustomerPortalPage.js`: Customer-only dashboard
- `frontend/src/pages/DashboardPage.js`: Staff dashboard with stats
- `frontend/src/components/ui/`: shadcn/ui component library

## Special Considerations

### Arabic/RTL Support
- Frontend uses RTL layout with `dir="rtl"`
- PDF exports use arabic-reshaper and python-bidi for proper text rendering
- All UI labels and messages support Arabic text

### Multi-Role Access
- Single phone number can have multiple roles (e.g., customer + employee)
- System determines routing based on `is_customer_only` flag
- Role precedence: admin > employee > accountant > customer

### Quick Actions via QR
- Equipment has QR codes for quick rent/return
- Dedicated pages: QuickRentPage, QuickReturnPage, QRScanPage
- Streamlined workflow bypassing full contract creation

### Settings Management
- Customizable header/footer text
- Landing page content configuration
- WhatsApp API credentials
- Stored as singleton MongoDB document