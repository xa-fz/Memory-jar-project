from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.core.security import (
    clear_auth_cookie,
    create_access_token,
    extract_access_token,
    revoke_token,
    set_auth_cookie,
    verify_password,
)
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import LoginRequest, UserInfo

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def _user_info(user: User) -> dict:
    return UserInfo(
        id=user.id,
        username=user.username,
        created_at=user.created_at,
    ).model_dump()


@router.post("/login", summary="登录")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        return error_response(message="Invalid username or password", code=401)

    access_token = create_access_token(user_id=user.id, username=user.username)
    set_auth_cookie(response, access_token)
    return success_response(data={"user": _user_info(user)})


@router.post("/logout", summary="登出")
def logout(
    request: Request,
    response: Response,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    token = extract_access_token(request, authorization)
    if not token:
        return error_response(message="Not authenticated", code=401)

    revoke_token(token)
    clear_auth_cookie(response)
    return success_response(message="Logged out")


@router.get("/me", summary="当前用户信息")
def get_me(current_user: User = Depends(get_current_user)):
    return success_response(data=_user_info(current_user))
