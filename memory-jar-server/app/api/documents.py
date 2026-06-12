from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.db.database import get_db
from app.db.models import Document, User
from app.schemas.documents import DocumentDetail, DocumentListItem, DocumentUploadData

router = APIRouter(prefix="/api/documents", tags=["documents"])
upload_router = APIRouter(prefix="/api/documents/upload", tags=["documents"])

ALLOWED_EXTENSIONS = {
    ".txt",
    ".md",
    ".pdf",
    ".doc",
    ".docx",
    ".json",
    ".xml",
    ".csv",
    ".xlsx",
}

PREVIEW_MAX_LEN = 120


def _preview(text: str) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= PREVIEW_MAX_LEN:
        return normalized
    return f"{normalized[:PREVIEW_MAX_LEN]}..."


def _format_date(doc: Document) -> str:
    created = doc.created_at
    return created.date().isoformat() if created else ""


def _to_list_item(doc: Document) -> dict:
    return DocumentListItem(
        id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        preview=_preview(doc.content),
        date=_format_date(doc),
    ).model_dump()


def _to_detail(doc: Document) -> dict:
    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        content=doc.content,
        file_size=doc.file_size,
        date=_format_date(doc),
    ).model_dump()


def _decode_text(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return content.decode("gbk")
        except UnicodeDecodeError:
            return content.decode("utf-8", errors="ignore")


@router.get("/")
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return success_response(data=[_to_list_item(doc) for doc in docs])


@router.get("/{document_id}")
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        return error_response(message="Document not found", code=404)

    return success_response(data=_to_detail(doc))


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        return error_response(message="Document not found", code=404)

    db.delete(doc)
    db.commit()
    return success_response(message="success")


@upload_router.post("/")
async def upload_document(
    file: UploadFile = File(..., description="Upload file (txt, md, pdf, doc, json, etc.)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = file.filename or "Untitled"
    ext = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""

    if ext and ext not in ALLOWED_EXTENSIONS:
        return error_response(
            message=f"Unsupported file type. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            code=400,
        )

    try:
        raw = await file.read()
        text_content = _decode_text(raw)
        if not text_content.strip():
            return error_response(message="File content is empty", code=400)
    except Exception as exc:
        return error_response(message=f"Failed to read file: {exc}", code=500)

    doc = Document(
        user_id=current_user.id,
        title=filename,
        file_type=ext,
        content=text_content,
        file_size=len(raw),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    data = DocumentUploadData(id=doc.id, title=doc.title, file_type=doc.file_type).model_dump()
    return success_response(data=data, message="success")
