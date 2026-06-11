from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
from fastapi import Request, Response
from jose import jwt

from app.core.config import settings

SameSite = Literal["lax", "strict", "none"]

# 登出后的 token 黑名单（进程内；生产可换 Redis）
revoked_tokens: set[str] = set()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(*, user_id: int, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": username,
        "uid": user_id,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def revoke_token(token: str) -> None:
    revoked_tokens.add(token)


def is_token_revoked(token: str) -> bool:
    return token in revoked_tokens


def _cookie_base() -> dict:
    samesite: SameSite = settings.auth_cookie_samesite.lower()  # type: ignore[assignment]
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"
    return {
        "key": settings.auth_cookie_name,
        "httponly": True,
        "samesite": samesite,
        "secure": settings.auth_cookie_secure,
        "path": "/",
    }


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(value=token, max_age=settings.jwt_expire_minutes * 60, **_cookie_base())


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(**_cookie_base())


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def extract_access_token(request: Request, authorization: str | None = None) -> str | None:
    token = request.cookies.get(settings.auth_cookie_name)
    if token:
        return token
    return extract_bearer_token(authorization)
