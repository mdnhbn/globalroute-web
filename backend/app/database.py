from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def initialize_database():
    import app.models  # noqa: F401 - register all models before creating missing tables

    with engine.begin() as connection:
        if connection.dialect.name == "postgresql":
            # Startup can run concurrently during deploys and function cold starts.
            connection.execute(text("SELECT pg_advisory_xact_lock(912318042)"))
        Base.metadata.create_all(bind=connection)


def get_db():
    with SessionLocal() as db:
        yield db
