
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
from routers import auth, customers, equipment, rentals, invoices, reports, settings, reminders, quick_rental, users, exports

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
api_router.include_router(users.router)
api_router.include_router(customers.router)
api_router.include_router(equipment.router)
api_router.include_router(rentals.router)
api_router.include_router(invoices.router)
api_router.include_router(reports.router)
api_router.include_router(exports.router)
api_router.include_router(settings.router)
api_router.include_router(reminders.router)
api_router.include_router(quick_rental.router)

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

@app.middleware("http")
async def catch_exceptions_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        import traceback
        with open("error_log.txt", "a", encoding="utf-8") as f:
            f.write(f"Error on {request.url}:\n")
            traceback.print_exc(file=f)
            f.write("\n")
        raise

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        await client.server_info()
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": os.popen('date').read().strip() if os.name != 'nt' else None
    }

# Serve React frontend in production
FRONTEND_DIR = ROOT_DIR.parent / "frontend" / "build"
if FRONTEND_DIR.exists():
    # Mount static files
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR / "static")), name="static")

    # Serve index.html for all non-API routes (React Router support)
    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        # Skip API routes
        if path.startswith("api/") or path in ["docs", "redoc", "openapi.json"]:
            return {"detail": "Not Found"}

        # Check if it's a static file
        file_path = FRONTEND_DIR / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))

        # Otherwise serve index.html (for React Router)
        return FileResponse(str(FRONTEND_DIR / "index.html"))

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
