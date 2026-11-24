# Language: Python | Target: FastAPI Application Entrypoint with Career & Visa Routes
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 - সব ডাটাবেজ মডেল রেজিস্টার করার জন্য
from app.config import settings
from app.database import Base, engine
from app.routes import admin, auth, career_visa, payments_and_ads


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

allow_origins = (
    ["*"]
    if settings.FRONTEND_URL.strip() == "*"
    else [origin.strip() for origin in settings.FRONTEND_URL.split(",") if origin.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}


app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(payments_and_ads.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(career_visa.router, prefix=settings.API_V1_STR)
