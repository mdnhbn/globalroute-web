# Language: Python | Target: FastAPI Backend Configuration (Render)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GlobalRoute API"
    API_V1_STR: str = "/api/v1"

    # Render বা লোকাল এনভায়রনমেন্ট থেকে DATABASE_URL নেবে; না থাকলে লোকাল SQLite fallback ব্যবহার করবে
    DATABASE_URL: str = "sqlite:///./globalroute_dev.db"

    SECRET_KEY: str = "change-this-to-a-strong-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS (Vercel ফ্রন্টএন্ড থেকে রিকোয়েস্ট আসার জন্য)
    FRONTEND_URL: str = "*"

    # WhatsApp Cloud API (পরবর্তীতে Render Environment Variables-এ বসানো যাবে)
    WHATSAPP_API_URL: str = ""
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
