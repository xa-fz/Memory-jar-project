from pydantic import BaseModel


class DocumentListItem(BaseModel):
    id: int
    title: str
    file_type: str
    file_size: int
    date: str


class DocumentDetail(BaseModel):
    id: int
    title: str
    file_type: str
    content: str
    file_size: int
    date: str


class DocumentUploadData(BaseModel):
    id: int
    title: str
    file_type: str
