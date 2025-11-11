from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Dependency for database
def get_db():
    return db

# Create the main app without a prefix
app = FastAPI(title="Rental Management System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import routers
from routers import auth, customers, equipment, rentals, invoices, reports, employees, settings, reminders, quick_rental

# Add routes to API router
@api_router.get("/")
async def root():
    return {
        "message": "Rental Management System API",
        "version": "1.0.0",
        "status": "running"
    }

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(customers.router)
api_router.include_router(equipment.router)
api_router.include_router(rentals.router)
api_router.include_router(invoices.router)
api_router.include_router(reports.router)
api_router.include_router(employees.router)
api_router.include_router(settings.router)
api_router.include_router(reminders.router)

# Include the API router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()