from pathlib import Path

from app.core.config import settings

UPLOAD_ROOT = Path(settings.upload_dir)


def ensure_upload_root() -> None:
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


def document_file_path(user_id: int, document_id: int, file_type: str) -> Path:
    ext = file_type if file_type.startswith(".") else f".{file_type}" if file_type else ""
    return UPLOAD_ROOT / str(user_id) / f"{document_id}{ext}"


def save_document_file(user_id: int, document_id: int, file_type: str, raw: bytes) -> Path:
    ensure_upload_root()
    path = document_file_path(user_id, document_id, file_type)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw)
    return path


def delete_document_file(user_id: int, document_id: int, file_type: str) -> None:
    path = document_file_path(user_id, document_id, file_type)
    if path.is_file():
        path.unlink()
