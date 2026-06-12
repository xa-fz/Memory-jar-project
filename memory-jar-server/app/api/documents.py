import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.file_extract import extract_text_content
from app.core.response import error_response, success_response
from app.core.storage import delete_document_file, document_file_path, save_document_file
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
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
}


def _format_date(doc: Document) -> str:
    created = doc.created_at
    return created.date().isoformat() if created else ""


def _to_list_item(doc: Document) -> dict:
    return DocumentListItem(
        id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        file_size=doc.file_size,
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


def _guess_media_type(file_type: str) -> str:
    ext = file_type if file_type.startswith(".") else f".{file_type}"
    media_type, _ = mimetypes.guess_type(f"file{ext}")
    return media_type or "application/octet-stream"


def _get_owned_document(
    document_id: int,
    current_user: User,
    db: Session,
) -> Document | None:
    return (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )


def _build_file_response(doc: Document, user_id: int, *, attachment: bool):
    path = document_file_path(user_id, doc.id, doc.file_type)
    if not path.is_file():
        return error_response(message="Original file not found", code=404)

    return FileResponse(
        path=Path(path),
        media_type=_guess_media_type(doc.file_type),
        filename=doc.title,
        content_disposition_type="attachment" if attachment else "inline",
    )


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


@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, current_user, db)
    if not doc:
        return error_response(message="Document not found", code=404)

    return _build_file_response(doc, current_user.id, attachment=False)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, current_user, db)
    if not doc:
        return error_response(message="Document not found", code=404)

    return _build_file_response(doc, current_user.id, attachment=True)


@router.get("/{document_id}")
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, current_user, db)
    if not doc:
        return error_response(message="Document not found", code=404)

    return success_response(data=_to_detail(doc))


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, current_user, db)
    if not doc:
        return error_response(message="Document not found", code=404)

    delete_document_file(current_user.id, doc.id, doc.file_type)
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
        if not raw:
            return error_response(message="File content is empty", code=400)
        text_content = extract_text_content(raw, ext)
        if not text_content.strip():
            return error_response(message="File content is empty", code=400)
    except ValueError as exc:
        return error_response(message=str(exc), code=400)
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

    try:
        save_document_file(current_user.id, doc.id, ext, raw)
    except Exception as exc:
        db.delete(doc)
        db.commit()
        return error_response(message=f"Failed to save file: {exc}", code=500)

    data = DocumentUploadData(id=doc.id, title=doc.title, file_type=doc.file_type).model_dump()
    return success_response(data=data, message="success")
