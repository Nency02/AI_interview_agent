import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_instance = MongoDB()

async def init_db():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}")
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
        db_instance.db = db_instance.client[settings.DB_NAME]
        
        # Ping the database
        await db_instance.db.command("ping")
        logger.info("Successfully connected to MongoDB")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise e

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")

def get_db():
    if db_instance.db is None:
        raise RuntimeError("Database not initialized")
    return db_instance.db

async def get_collection(name: str):
    db = get_db()
    return db[name]
