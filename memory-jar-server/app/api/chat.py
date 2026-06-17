import json
from collections.abc import Iterator
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.chat_service import answer_question, stream_answer_text
from app.core.conversation_service import (
    add_message,
    build_conversation_title,
    conversation_to_detail,
    conversation_to_list_item,
    create_conversation,
    delete_conversation,
    get_conversation,
    list_conversations,
    message_to_dict,
    prepare_message_edit,
    update_conversation_title,
)
from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.db.database import SessionLocal, get_db
from app.db.models import Conversation, Message, User
from app.schemas.chat import ChatRequest, ChatResponseData
from app.schemas.conversations import (
    ConversationCreateData,
    ConversationCreateRequest,
    ConversationDetail,
    ConversationListItem,
    ConversationUpdateRequest,
    MessageItem,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _prepare_chat_exchange(
    db: Session,
    *,
    body: ChatRequest,
    current_user: User,
) -> tuple[Conversation, list[dict], Message, str] | dict:
    question = body.question.strip()
    if not question:
        return error_response(message="Question is empty", code=400)

    conversation: Conversation | None = None
    if body.conversation_id is not None:
        conversation = get_conversation(
            db,
            user_id=current_user.id,
            conversation_id=body.conversation_id,
        )
        if not conversation:
            return error_response(message="Conversation not found", code=404)
    else:
        title = build_conversation_title(question) or "新对话"
        conversation = create_conversation(
            db,
            user_id=current_user.id,
            title=title,
        )

    prior_history: list[dict] = []
    user_message: Message | None = None

    if body.edit_from_message_id is not None:
        conversation, prior_history, user_message = prepare_message_edit(
            db,
            user_id=current_user.id,
            conversation_id=conversation.id,
            message_id=body.edit_from_message_id,
            new_content=question,
        )
        if not conversation or user_message is None:
            return error_response(message="Message not found", code=404)
    else:
        prior_history = [
            {"role": message.role, "content": message.content}
            for message in (
                db.query(Message)
                .filter(Message.conversation_id == conversation.id)
                .order_by(Message.created_at, Message.id)
                .all()
            )
        ]

    if user_message is None:
        user_message = add_message(
            db,
            conversation=conversation,
            role="user",
            content=question,
            commit=False,
        )

    first_user_message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id, Message.role == "user")
        .order_by(Message.created_at, Message.id)
        .first()
    )
    if (
        first_user_message
        and first_user_message.id == user_message.id
        and not conversation.title_customized
    ):
        title = build_conversation_title(question)
        if title:
            conversation.title = title

    db.commit()
    db.refresh(conversation)
    db.refresh(user_message)

    return conversation, prior_history, user_message, question


@router.get("/conversations")
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = [
        ConversationListItem(**conversation_to_list_item(item)).model_dump()
        for item in list_conversations(db, user_id=current_user.id)
    ]
    return success_response(data=items)


@router.post("/conversations")
def create_conversation_endpoint(
    body: ConversationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = create_conversation(
        db,
        user_id=current_user.id,
        title=body.title.strip(),
    )
    data = ConversationCreateData(**conversation_to_detail(conversation)).model_dump()
    return success_response(data=data)


@router.get("/conversations/{conversation_id}")
def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = get_conversation(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
    )
    if not conversation:
        return error_response(message="Conversation not found", code=404)
    data = ConversationDetail(**conversation_to_detail(conversation)).model_dump()
    return success_response(data=data)


@router.delete("/conversations/{conversation_id}")
def remove_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_conversation(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
    )
    if not deleted:
        return error_response(message="Conversation not found", code=404)
    return success_response(data={"id": conversation_id})


@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: int,
    body: ConversationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = update_conversation_title(
        db,
        user_id=current_user.id,
        conversation_id=conversation_id,
        title=body.title,
    )
    if not conversation:
        return error_response(message="Conversation not found", code=404)
    data = ConversationListItem(**conversation_to_list_item(conversation)).model_dump()
    return success_response(data=data)


@router.post("/")
def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prepared = _prepare_chat_exchange(db, body=body, current_user=current_user)
    if isinstance(prepared, dict):
        return prepared

    conversation, prior_history, user_message, question = prepared

    try:
        result = answer_question(
            user_id=current_user.id,
            question=question,
            history=prior_history,
        )
        assistant_message = add_message(
            db,
            conversation=conversation,
            role="assistant",
            content=result["answer"],
            sources=result.get("sources") or [],
            commit=False,
        )
        db.commit()
        db.refresh(conversation)
        db.refresh(user_message)
        db.refresh(assistant_message)
    except ValueError as exc:
        db.rollback()
        return error_response(message=str(exc), code=400)
    except Exception as exc:
        db.rollback()
        return error_response(message=f"Failed to generate answer: {exc}", code=500)

    data = ChatResponseData(
        answer=result["answer"],
        sources=result.get("sources") or [],
        conversation_id=conversation.id,
        conversation_title=conversation.title,
        user_message=MessageItem(**message_to_dict(user_message)),
        assistant_message=MessageItem(**message_to_dict(assistant_message)),
    ).model_dump()
    return success_response(data=data)


@router.post("/stream")
def chat_stream(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prepared = _prepare_chat_exchange(db, body=body, current_user=current_user)
    if isinstance(prepared, dict):
        return prepared

    conversation, prior_history, user_message, question = prepared
    user_id = current_user.id
    conversation_id = conversation.id
    conversation_title = conversation.title
    user_message_data = message_to_dict(user_message)

    def generate() -> Iterator[str]:
        answer_parts: list[str] = []
        try:
            yield _sse(
                "meta",
                {
                    "conversation_id": conversation_id,
                    "conversation_title": conversation_title,
                    "user_message": user_message_data,
                },
            )

            stream, sources = stream_answer_text(
                user_id=user_id,
                question=question,
                history=prior_history,
            )
            for chunk in stream:
                answer_parts.append(chunk)
                yield _sse("delta", {"content": chunk})

            answer = "".join(answer_parts).strip()
            if not answer:
                raise ValueError("LLM returned empty answer")

            write_db = SessionLocal()
            try:
                write_conversation = get_conversation(
                    write_db,
                    user_id=user_id,
                    conversation_id=conversation_id,
                )
                if not write_conversation:
                    raise ValueError("Conversation not found")

                assistant_message = add_message(
                    write_db,
                    conversation=write_conversation,
                    role="assistant",
                    content=answer,
                    sources=sources,
                    commit=False,
                )
                write_db.commit()
                write_db.refresh(write_conversation)
                write_db.refresh(assistant_message)

                persisted_user = (
                    write_db.query(Message)
                    .filter(
                        Message.id == user_message_data["id"],
                        Message.conversation_id == conversation_id,
                    )
                    .first()
                )
                if not persisted_user:
                    raise ValueError("User message not found")

                data = ChatResponseData(
                    answer=answer,
                    sources=sources,
                    conversation_id=write_conversation.id,
                    conversation_title=write_conversation.title,
                    user_message=MessageItem(**message_to_dict(persisted_user)),
                    assistant_message=MessageItem(**message_to_dict(assistant_message)),
                ).model_dump()
            finally:
                write_db.close()

            yield _sse("done", data)
        except ValueError as exc:
            yield _sse("error", {"message": str(exc), "code": 400})
        except Exception as exc:
            yield _sse("error", {"message": f"Failed to generate answer: {exc}", "code": 500})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
