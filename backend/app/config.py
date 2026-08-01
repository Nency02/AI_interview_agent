import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "ai_interview_coach"
    JWT_SECRET: str = "supersecretjwtkeyforaiinterviewcoach2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    GROQ_API_KEY: str = ""
    DEFAULT_MODEL: str = "llama-3.3-70b-versatile"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Email / SMTP Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""

    # n8n Webhook
    N8N_FEEDBACK_WEBHOOK: str = "http://localhost:5678/webhook/feedback"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
