from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import logging
from datetime import datetime, timedelta
import secrets
from passlib.context import CryptContext
import jwt
from bson import ObjectId

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rental Management System", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "rental_management")]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None

class User(BaseModel):
    username: str
    role: str
    phone: Optional[str] = None

# API Router
api_router = APIRouter(prefix="/api")

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(request: Request):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise credentials_exception

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception

    return User(username=user["username"], role=user.get("role", "customer"), phone=user.get("phone"))

# Auth endpoints
@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    # Check user in database
    user = await db.users.find_one({"username": user_credentials.username})

    if not user:
        # Create default admin if no users exist
        user_count = await db.users.count_documents({})
        if user_count == 0:
            hashed_password = pwd_context.hash("admin123")
            admin_user = {
                "username": "admin",
                "password": hashed_password,
                "role": "admin",
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(admin_user)

            if user_credentials.username == "admin" and user_credentials.password == "admin123":
                access_token = create_access_token(data={"sub": "admin", "role": "admin"})
                return {"access_token": access_token, "token_type": "bearer", "role": "admin"}

        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Verify password
    if not pwd_context.verify(user_credentials.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # Create token
    access_token = create_access_token(
        data={"sub": user["username"], "role": user.get("role", "customer")}
    )

    return {"access_token": access_token, "token_type": "bearer", "role": user.get("role", "customer")}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Main API endpoints
@api_router.get("/")
async def root():
    return {
        "message": "Rental Management System API",
        "version": "1.0.0",
        "status": "running",
        "database": "connected" if client else "disconnected"
    }

@api_router.get("/health")
async def health_check():
    try:
        # Check database connection
        await client.server_info()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# Equipment endpoints
@api_router.get("/equipment")
async def get_equipment(current_user: User = Depends(get_current_user)):
    equipment = await db.equipment.find({}).to_list(100)
    for item in equipment:
        item["_id"] = str(item["_id"])
    return equipment

@api_router.post("/equipment")
async def create_equipment(equipment: dict, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    equipment["created_at"] = datetime.utcnow()
    equipment["status"] = "available"
    result = await db.equipment.insert_one(equipment)
    equipment["_id"] = str(result.inserted_id)
    return equipment

# Customers endpoints
@api_router.get("/customers")
async def get_customers(current_user: User = Depends(get_current_user)):
    customers = await db.customers.find({}).to_list(100)
    for customer in customers:
        customer["_id"] = str(customer["_id"])
    return customers

@api_router.post("/customers")
async def create_customer(customer: dict, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    customer["created_at"] = datetime.utcnow()
    result = await db.customers.insert_one(customer)
    customer["_id"] = str(result.inserted_id)
    return customer

# Rentals endpoints
@api_router.get("/rentals")
async def get_rentals(current_user: User = Depends(get_current_user)):
    rentals = await db.rentals.find({}).to_list(100)
    for rental in rentals:
        rental["_id"] = str(rental["_id"])
    return rentals

@api_router.post("/rentals")
async def create_rental(rental: dict, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    rental["created_at"] = datetime.utcnow()
    rental["status"] = "active"
    result = await db.rentals.insert_one(rental)
    rental["_id"] = str(result.inserted_id)

    # Update equipment status
    if "equipment_id" in rental:
        await db.equipment.update_one(
            {"_id": ObjectId(rental["equipment_id"])},
            {"$set": {"status": "rented"}}
        )

    return rental

# Include router
app.include_router(api_router)

# Root endpoint (for web access)
@app.get("/", response_class=HTMLResponse)
async def web_root():
    return """
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام إدارة التأجير</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Tahoma', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                padding: 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 2em;
            }
            .status {
                background: #10b981;
                color: white;
                padding: 10px 20px;
                border-radius: 50px;
                display: inline-block;
                margin: 20px 0;
                font-weight: bold;
            }
            .info {
                background: #f3f4f6;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .info p {
                margin: 10px 0;
                color: #666;
            }
            .api-link {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                transition: transform 0.2s;
            }
            .api-link:hover {
                transform: translateY(-2px);
                background: #5a67d8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏢 نظام إدارة التأجير</h1>
            <div class="status">✅ النظام يعمل</div>
            <div class="info">
                <p><strong>الإصدار:</strong> 1.0.0</p>
                <p><strong>حالة قاعدة البيانات:</strong> متصل</p>
                <p><strong>API متاح على:</strong> /api</p>
            </div>
            <a href="/api" class="api-link">استكشاف API</a>
        </div>
    </body>
    </html>
    """

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Rental Management System")
    try:
        await client.server_info()
        logger.info("Successfully connected to MongoDB")

        # Create indexes
        await db.users.create_index("username", unique=True)
        await db.equipment.create_index("barcode")
        await db.customers.create_index("phone")

        # Create admin user if doesn't exist
        admin_exists = await db.users.find_one({"username": "admin"})
        if not admin_exists:
            admin_user = {
                "username": "admin",
                "password": pwd_context.hash("admin123"),
                "role": "admin",
                "created_at": datetime.utcnow()
            }
            await db.users.insert_one(admin_user)
            logger.info("Admin user created with default password")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    logger.info("Application shutdown")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)