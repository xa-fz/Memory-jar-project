from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import documents
from app.core.response import register_exception_handlers

app = FastAPI(title="Memory Jar API", version="1.0.0")

# 注册全局异常处理器
register_exception_handlers(app)

# 包含文档路由
app.include_router(documents.router)
app.include_router(documents.upload_router)

# 配置 CORS（允许前端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 前端地址
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
