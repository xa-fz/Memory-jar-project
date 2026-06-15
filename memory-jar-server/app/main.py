from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, chat, documents
from app.core.config import settings
from app.core.response import register_exception_handlers
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Memory Jar API", version="1.0.0", lifespan=lifespan)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(documents.upload_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Memory Jar API is running"}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "memory-jar-server"}
