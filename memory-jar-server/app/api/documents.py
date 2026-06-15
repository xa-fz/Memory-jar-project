import logging
import mimetypes
from datetime import timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.file_extract import extract_text_content
from app.core.response import error_response, success_response
from app.core.storage import delete_document_file, document_file_path, save_document_file
from app.core.summary import generate_summary
from app.core.vector_store import get_vector_store, get_vectorized_document_ids
from app.db.database import get_db
from app.db.models import Document, User
from app.schemas.documents import (
    DocumentDetail,
    DocumentListItem,
    DocumentUploadData,
    DocumentVectorizeData,
)

logger = logging.getLogger(__name__)

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
    if not created:
        return ""
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    else:
        created = created.astimezone(timezone.utc)
    return created.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S") + "Z"


def _to_list_item(doc: Document, *, vectorized: bool) -> dict:
    return DocumentListItem(
        id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        file_size=doc.file_size,
        date=_format_date(doc),
        vectorized=vectorized,
    ).model_dump()


def _to_detail(doc: Document) -> dict:
    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        content=doc.content,
        summary=doc.summary,
        file_size=doc.file_size,
        date=_format_date(doc),
    ).model_dump()


def _parse_bool_form(value: str) -> bool:
    return value.strip().lower() in {"true", "1", "yes", "on"}


async def _read_uploaded_file(file: UploadFile) -> tuple[str, str, bytes, str]:
    filename = file.filename or "Untitled"
    ext = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""

    if ext and ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    raw = await file.read()
    if not raw:
        raise ValueError("File content is empty")

    text_content = extract_text_content(raw, ext)
    if not text_content.strip():
        raise ValueError("File content is empty")

    return filename, ext, raw, text_content


def _maybe_generate_summary(should_summarize: bool, text_content: str) -> str | None:
    if not should_summarize:
        return None
    return generate_summary(text_content)


def _vectorize_document(doc: Document) -> int:
    return get_vector_store().index_document(
        user_id=doc.user_id,
        document_id=doc.id,
        title=doc.title,
        content=doc.content,
    )


def _delete_document_vectors(user_id: int, document_id: int) -> None:
    try:
        get_vector_store().delete_document(user_id=user_id, document_id=document_id)
    except Exception:
        pass


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
    vectorized_ids = get_vectorized_document_ids(current_user.id)
    return success_response(
        data=[_to_list_item(doc, vectorized=doc.id in vectorized_ids) for doc in docs]
    )


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


@router.post("/{document_id}/vectorize")
def vectorize_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """对指定文档建立或重建向量索引（文档列表「向量化 / 重新向量化」）"""
    doc = _get_owned_document(document_id, current_user, db)
    if not doc:
        return error_response(message="Document not found", code=404)

    if not doc.content.strip():
        return error_response(message="Document content is empty", code=400)

    try:
        chunks = _vectorize_document(doc)
    except Exception as exc:
        logger.exception("Failed to vectorize document %s", document_id)
        return error_response(message=f"Failed to vectorize document: {exc}", code=500)

    data = DocumentVectorizeData(id=doc.id, vectorized=True, chunks=chunks).model_dump()
    return success_response(data=data, message="success")


@router.put("/{document_id}")
async def update_document(
    document_id: int,
    file: UploadFile = File(..., description="Replacement file"),
    enable_summary: str = Form("false"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, current_user, db)
    if not doc:
        return error_response(message="Document not found", code=404)

    should_summarize = _parse_bool_form(enable_summary)

    try:
        filename, ext, raw, text_content = await _read_uploaded_file(file)
    except ValueError as exc:
        return error_response(message=str(exc), code=400)
    except Exception as exc:
        return error_response(message=f"Failed to read file: {exc}", code=500)

    if should_summarize:
        try:
            summary = generate_summary(text_content)
        except ValueError as exc:
            return error_response(message=str(exc), code=400)
        except Exception as exc:
            return error_response(message=f"Failed to generate summary: {exc}", code=500)
    else:
        summary = doc.summary

    old_file_type = doc.file_type
    if old_file_type != ext:
        delete_document_file(current_user.id, doc.id, old_file_type)

    doc.title = filename
    doc.file_type = ext
    doc.content = text_content
    doc.summary = summary
    doc.file_size = len(raw)
    db.commit()

    try:
        save_document_file(current_user.id, doc.id, ext, raw)
    except Exception as exc:
        return error_response(message=f"Failed to save file: {exc}", code=500)

    _delete_document_vectors(current_user.id, doc.id)

    data = DocumentUploadData(id=doc.id, title=doc.title, file_type=doc.file_type).model_dump()
    return success_response(data=data, message="success")


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
    _delete_document_vectors(current_user.id, doc.id)
    db.delete(doc)
    db.commit()
    return success_response(message="success")


@upload_router.post("/")
async def upload_document(
    file: UploadFile = File(..., description="Upload file (txt, md, pdf, doc, json, etc.)"),
    enable_summary: str = Form("false"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    should_summarize = _parse_bool_form(enable_summary)

    try:
        filename, ext, raw, text_content = await _read_uploaded_file(file)
    except ValueError as exc:
        return error_response(message=str(exc), code=400)
    except Exception as exc:
        return error_response(message=f"Failed to read file: {exc}", code=500)

    try:
        summary = _maybe_generate_summary(should_summarize, text_content)
    except ValueError as exc:
        return error_response(message=str(exc), code=400)
    except Exception as exc:
        return error_response(message=f"Failed to generate summary: {exc}", code=500)

    doc = Document(
        user_id=current_user.id,
        title=filename,
        file_type=ext,
        content=text_content,
        summary=summary,
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
