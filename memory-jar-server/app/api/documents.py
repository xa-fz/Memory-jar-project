# app/api/documents.py
from fastapi import APIRouter, HTTPException, UploadFile, File, status
from app.core.response import success_response, error_response

router = APIRouter(prefix="/api/documents", tags=["documents"])

# 为 upload 路由单独注册
upload_router = APIRouter(prefix="/api/documents/upload", tags=["documents"])

# 临时存储（后面会改数据库）
documents_store = []
current_id = 1

# 支持的文件类型
ALLOWED_EXTENSIONS = {'.txt', '.md', '.pdf', '.doc', '.docx', '.json', '.xml', '.csv', '.xlsx'}

@upload_router.post("/", responses={
    200: {
        "description": "成功",
        "content": {
            "application/json": {
                "example": {
                    "code": 200,
                    "message": "success",
                    "data": {
                        "id": 1,
                        "title": "我的笔记.md"
                    }
                }
            }
        }
    },
    400: {
        "description": "请求错误",
        "content": {
            "application/json": {
                "example": {
                    "code": 400,
                    "message": "Unsupported file type. Allowed types: .txt, .md, .pdf, etc.",
                    "data": None
                }
            }
        }
    }
})
async def upload_document(
    file: UploadFile = File(..., description="Upload file (txt, md, pdf, doc, json, etc.)")
):
    """
    Upload document to knowledge base
    
    - Auto extract filename as title
    - Auto read file content
    - Support multiple text formats
    """
    
    # 1. 检查文件扩展名
    filename = file.filename or "Untitled"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext and ext not in ALLOWED_EXTENSIONS:
        return error_response(
            message=f"Unsupported file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
            code=400
        )
    
    # 2. 读取文件内容
    try:
        content = await file.read()
        # 尝试解码为文本
        try:
            text_content = content.decode('utf-8')
        except UnicodeDecodeError:
            # 如果 UTF-8 失败，尝试其他编码
            try:
                text_content = content.decode('gbk')
            except UnicodeDecodeError:
                text_content = content.decode('utf-8', errors='ignore')
        
        # If content is empty
        if not text_content.strip():
            return error_response(message="File content is empty", code=400)
            
    except Exception as e:
        return error_response(message=f"Failed to read file: {str(e)}", code=500)
    
    # 3. 保存文档
    global current_id
    new_doc = {
        "id": current_id,
        "title": filename,
        "content": text_content
    }
    documents_store.append(new_doc)
    current_id += 1
    
    # 4. 返回结果（不返回 content，只返回基本信息）
    return success_response(data={"id": current_id - 1, "title": filename}, message="success")