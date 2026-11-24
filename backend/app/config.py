from secrets import token_urlsafe
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GlobalRoute API"
    API_V1_STR: str = "/api/v1"
    APP_ENV: Literal["development", "production"] = "development"
    RENDER: bool = False
    VERCEL: bool = False

    DATABASE_URL: str = "sqlite:///./globalroute_dev.db"
    SECRET_KEY: str = Field(default_factory=lambda: token_urlsafe(64), repr=False)
    ALGORITHM: Literal["HS256", "HS384", "HS512"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24, gt=0)

    FRONTEND_URL: str = "http://localhost:3000,http://127.0.0.1:3000"

    WHATSAPP_API_URL: str = ""
    WHATSAPP_TOKEN: str = Field(default="", repr=False)
    WHATSAPP_PHONE_NUMBER_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        hide_input_in_errors=True,
    )

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production" or self.RENDER or self.VERCEL

    @property
    def frontend_origins(self) -> list[str]:
        return [value.strip().rstrip("/") for value in self.FRONTEND_URL.split(",") if value.strip()]

    @model_validator(mode="after")
    def validate_deployment_settings(self):
        allowed_schemes = {"https"} if self.is_production else {"http", "https"}
        if not self.frontend_origins:
            raise ValueError("FRONTEND_URL must contain at least one frontend origin")

        for origin in self.frontend_origins:
            url = urlsplit(origin)
            if (
                url.scheme not in allowed_schemes
                or not url.hostname
                or "*" in url.hostname
                or url.username is not None
                or url.path
                or url.query
                or url.fragment
                or "?" in origin
                or "#" in origin
                or any(character.isspace() for character in origin)
            ):
                raise ValueError("FRONTEND_URL must contain explicit frontend origins only")
            # Validate the port if one is present.
            _ = url.port

        if self.is_production:
            if not self.DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+psycopg2://")):
                raise ValueError("DATABASE_URL must point to PostgreSQL in production")

            minimum_key_bytes = int(self.ALGORITHM[2:]) // 8
            secret = self.SECRET_KEY.strip()
            if (
                "SECRET_KEY" not in self.model_fields_set
                or len(secret.encode()) < minimum_key_bytes
                or secret.lower().startswith(("replace-", "change-this"))
            ):
                raise ValueError("SECRET_KEY must be set to a strong random value in production")

        return self


settings = Settings()
