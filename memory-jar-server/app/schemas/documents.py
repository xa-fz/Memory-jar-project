from pydantic import BaseModel


class DocumentListItem(BaseModel):
    id: int
    title: str
    file_type: str
    file_size: int
    date: str
    vectorized: bool = False


class DocumentVectorizeData(BaseModel):
    id: int
    vectorized: bool = True
    chunks: int = 0


class DocumentDetail(BaseModel):
    id: int
    title: str
    file_type: str
    content: str
    summary: str | None = None
    file_size: int
    date: str


class DocumentUploadData(BaseModel):
    id: int
    title: str
    file_type: str
