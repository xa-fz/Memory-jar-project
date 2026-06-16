from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.chat_service import answer_question
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
    truncate_messages_from,
    update_conversation_title,
)
from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.db.database import get_db
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

    is_first_message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .count()
        == 0
    )

    prior_history = [
        {"role": message.role, "content": message.content}
        for message in (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at)
            .all()
        )
    ]

    if body.edit_from_message_id is not None:
        updated, prior_history = truncate_messages_from(
            db,
            user_id=current_user.id,
            conversation_id=conversation.id,
            message_id=body.edit_from_message_id,
        )
        if not updated:
            return error_response(message="Message not found", code=404)
        conversation = updated
        is_first_message = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .count()
            == 0
        )

    try:
        user_message = add_message(
            db,
            conversation=conversation,
            role="user",
            content=question,
            commit=False,
        )

        if is_first_message and not conversation.title_customized:
            title = build_conversation_title(question)
            if title:
                conversation.title = title

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
