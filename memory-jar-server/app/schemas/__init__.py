# app/schemas/__init__.py
from pydantic import BaseModel

# File upload response model
class DocumentUploadResponse(BaseModel):
    id: int
    title: str
