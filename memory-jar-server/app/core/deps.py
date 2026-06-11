from fastapi import Depends, Header, HTTPException, Request
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, extract_access_token, is_token_revoked
from app.db.database import get_db
from app.db.models import User


def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    token = extract_access_token(request, authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    try:
        payload = decode_access_token(token)
        user_id = payload.get("uid")
        username = payload.get("sub")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    if user_id is None or not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id, User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
