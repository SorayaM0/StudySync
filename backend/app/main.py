from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.memberships import router as memberships_router
from app.api.notes import router as notes_router
from app.api.study_spaces import router as study_spaces_router
from app.api.websockets import router as websockets_router
from app.core.database import engine


app = FastAPI(
    title="StudySync API",
    description="Backend API for the StudySync collaborative study workspace.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(study_spaces_router)
app.include_router(memberships_router)
app.include_router(notes_router)
app.include_router(websockets_router)


@app.get("/")
def root():
    return {
        "message": "StudySync API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/health/database")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected"
    }