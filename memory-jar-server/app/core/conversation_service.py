from datetime import datetime, timezone
import json

from sqlalchemy.orm import Session

from app.db.models import Conversation, Message


def _format_datetime(value: datetime | None) -> str:
    if not value:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S") + "Z"


def build_conversation_title(question: str, max_len: int = 24) -> str:
    normalized = " ".join(question.split()).strip()
    if not normalized:
        return ""
    if len(normalized) <= max_len:
        return normalized
    return f"{normalized[:max_len]}…"


def message_to_dict(message: Message) -> dict:
    data = {
        "id": message.id,
        "role": message.role,
        "content": message.content,
        "created_at": _format_datetime(message.created_at),
        "sources": [],
    }
    if message.sources_json:
        try:
            parsed = json.loads(message.sources_json)
            if isinstance(parsed, list):
                data["sources"] = parsed
        except json.JSONDecodeError:
            pass
    return data


def conversation_to_list_item(conversation: Conversation) -> dict:
    return {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": _format_datetime(conversation.updated_at),
    }


def conversation_to_detail(conversation: Conversation) -> dict:
    return {
        "id": conversation.id,
        "title": conversation.title,
        "updated_at": _format_datetime(conversation.updated_at),
        "messages": [message_to_dict(message) for message in conversation.messages],
    }


def list_conversations(db: Session, *, user_id: int) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


def get_conversation(db: Session, *, user_id: int, conversation_id: int) -> Conversation | None:
    return (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == user_id)
        .first()
    )


def create_conversation(db: Session, *, user_id: int, title: str) -> Conversation:
    conversation = Conversation(user_id=user_id, title=title.strip())
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def delete_conversation(db: Session, *, user_id: int, conversation_id: int) -> bool:
    conversation = get_conversation(db, user_id=user_id, conversation_id=conversation_id)
    if not conversation:
        return False
    db.delete(conversation)
    db.commit()
    return True


def update_conversation_title(
    db: Session,
    *,
    user_id: int,
    conversation_id: int,
    title: str,
) -> Conversation | None:
    conversation = get_conversation(db, user_id=user_id, conversation_id=conversation_id)
    if not conversation:
        return None
    conversation.title = title.strip()
    conversation.title_customized = True
    db.commit()
    db.refresh(conversation)
    return conversation


def _ordered_messages(db: Session, conversation_id: int) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at, Message.id)
        .all()
    )


def _find_user_message_index(messages: list[Message], message_id: int) -> int | None:
    for index, message in enumerate(messages):
        if message.id == message_id and message.role == "user":
            return index
    return None


def prepare_message_edit(
    db: Session,
    *,
    user_id: int,
    conversation_id: int,
    message_id: int,
    new_content: str,
) -> tuple[Conversation | None, list[dict], Message | None]:
    """Overwrite the target user message and delete all later messages."""
    conversation = get_conversation(db, user_id=user_id, conversation_id=conversation_id)
    if not conversation:
        return None, [], None

    messages = _ordered_messages(db, conversation_id)
    target_index = _find_user_message_index(messages, message_id)
    if target_index is None:
        return None, [], None

    target = messages[target_index]
    prior_messages = messages[:target_index]
    later_ids = [message.id for message in messages[target_index + 1 :]]
    prior_history = [{"role": message.role, "content": message.content} for message in prior_messages]

    if later_ids:
        db.query(Message).filter(Message.id.in_(later_ids)).delete(synchronize_session=False)

    target.content = new_content.strip()
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)
    db.refresh(target)
    return conversation, prior_history, target


def add_message(
    db: Session,
    *,
    conversation: Conversation,
    role: str,
    content: str,
    sources: list[dict] | None = None,
    commit: bool = True,
) -> Message:
    sources_json = None
    if sources:
        sources_json = json.dumps(sources, ensure_ascii=False)

    message = Message(
        conversation_id=conversation.id,
        role=role,
        content=content,
        sources_json=sources_json,
    )
    conversation.updated_at = datetime.now(timezone.utc)
    db.add(message)
    if commit:
        db.commit()
        db.refresh(message)
        db.refresh(conversation)
    else:
        db.flush()
        db.refresh(message)
    return message


def maybe_update_title_from_question(
    db: Session,
    *,
    conversation: Conversation,
    question: str,
) -> None:
    count = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .count()
    )
    if count > 0:
        return
    title = build_conversation_title(question)
    if not title:
        return
    conversation.title = title
