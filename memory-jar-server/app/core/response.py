# app/core/response.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import TypeVar, Generic, Optional
from pydantic import BaseModel

T = TypeVar('T')

class BaseResponse(BaseModel, Generic[T]):
    """统一响应格式"""
    code: int = 200
    message: str = "success"
    data: Optional[T] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "success",
                "data": {}
            }
        }

class ErrorResponse(BaseModel):
    """统一错误响应格式"""
    code: int = 400
    message: str = "error"
    data: Optional[dict] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 400,
                "message": "Invalid request",
                "data": None
            }
        }

def success_response(data: T = None, message: str = "success", code: int = 200) -> dict:
    """成功响应"""
    return {
        "code": code,
        "message": message,
        "data": data
    }

def error_response(message: str = "error", code: int = 400, data: dict = None) -> dict:
    """错误响应"""
    return {
        "code": code,
        "message": message,
        "data": data
    }


def json_error(message: str = "error", code: int = 400, data: dict = None) -> JSONResponse:
    """错误响应（HTTP 状态码与 body.code 一致）"""
    return JSONResponse(
        status_code=code,
        content=error_response(message=message, code=code, data=data),
    )

def register_exception_handlers(app: FastAPI):
    """注册全局异常处理器"""
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """处理请求验证错误"""
        # 简化错误信息
        errors = exc.errors()
        error_messages = []
        
        for error in errors:
            loc = " -> ".join(str(l) for l in error["loc"])
            error_messages.append(f"{loc}: {error['msg']}")
        
        return JSONResponse(
            status_code=200,  # 返回 200 但 code 字段标识错误
            content=error_response(
                message="; ".join(error_messages) if error_messages else "请求参数验证失败",
                code=400,
                data={"errors": errors}
            )
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """处理 HTTP 异常"""
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=exc.detail if isinstance(exc.detail, str) else "Server error",
                code=exc.status_code
            )
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """处理通用异常"""
        return JSONResponse(
            status_code=500,
            content=error_response(
                message="Internal server error",
                code=500,
                data={"error": str(exc)} if app.debug else None
            )
        )
