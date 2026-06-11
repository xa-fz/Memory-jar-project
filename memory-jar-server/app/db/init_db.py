from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.db.models import User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_default_user(db)
    finally:
        db.close()


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
