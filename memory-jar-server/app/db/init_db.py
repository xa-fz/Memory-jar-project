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
        doc_rows = conn.execute(text("PRAGMA table_info(documents)")).fetchall()
        if doc_rows:
            doc_columns = {row[1] for row in doc_rows}
            if "file_type" not in doc_columns:
                conn.execute(
                    text(
                        "ALTER TABLE documents ADD COLUMN file_type VARCHAR(20) NOT NULL DEFAULT ''"
                    )
                )
            if "summary" not in doc_columns:
                conn.execute(text("ALTER TABLE documents ADD COLUMN summary TEXT"))

        conv_rows = conn.execute(text("PRAGMA table_info(conversations)")).fetchall()
        if conv_rows:
            conv_columns = {row[1] for row in conv_rows}
            if "title_customized" not in conv_columns:
                conn.execute(
                    text(
                        "ALTER TABLE conversations ADD COLUMN title_customized BOOLEAN NOT NULL DEFAULT 0"
                    )
                )

        msg_rows = conn.execute(text("PRAGMA table_info(messages)")).fetchall()
        if msg_rows:
            msg_columns = {row[1] for row in msg_rows}
            if "sources_json" not in msg_columns:
                conn.execute(text("ALTER TABLE messages ADD COLUMN sources_json TEXT"))


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
