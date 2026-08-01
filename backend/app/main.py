import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database.mongodb import init_db, close_db
from app.routes import auth, interview, report
from app.routes import feedback
from app.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB
    logger.info("Initializing database connection...")
    await init_db()
    yield
    # Close connection
    logger.info("Closing database connection...")
    await close_db()

app = FastAPI(
    title="AI Interview Coach API",
    description="Backend API for AI Interview Coach platform using FastAPI, LangGraph, and MongoDB",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. In production, change to actual frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to expose full error details during development
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception on {request.method} {request.url}:\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": tb}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(interview.router)
app.include_router(report.router)
app.include_router(feedback.router)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "AI Interview Coach API is running.",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
