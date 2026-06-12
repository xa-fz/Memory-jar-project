from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.storage import ensure_upload_root
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.db.models import Document, User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_upload_root()
    _migrate_schema()
    db = SessionLocal()
    try:
        _seed_default_user(db)
    finally:
        db.close()


def _migrate_schema() -> None:
    """为已有 SQLite 库补列（create_all 不会改已有表结构）"""
    with engine.begin() as conn:
        rows = conn.execute(text("PRAGMA table_info(documents)")).fetchall()
        if not rows:
            return
        columns = {row[1] for row in rows}
        if "file_type" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE documents ADD COLUMN file_type VARCHAR(20) NOT NULL DEFAULT ''"
                )
            )
        if "summary" not in columns:
            conn.execute(text("ALTER TABLE documents ADD COLUMN summary TEXT"))


def _seed_default_user(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    db.add(
        User(
            username=settings.default_username,
            password_hash=hash_password(settings.default_password),
        )
    )
    db.commit()
