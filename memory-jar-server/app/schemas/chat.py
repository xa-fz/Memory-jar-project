from pydantic import BaseModel, Field, field_validator

from app.schemas.conversations import ChatSource, MessageItem
from app.schemas.validators import strip_required_text


class ChatRequest(BaseModel):
    question: str = Field(max_length=4000)
    conversation_id: int | None = None
    edit_from_message_id: int | None = None

    @field_validator("question")
    @classmethod
    def normalize_question(cls, value: str) -> str:
        return strip_required_text(value, field_name="Question")


class ChatResponseData(BaseModel):
    answer: str
    sources: list[ChatSource] = Field(default_factory=list)
    conversation_id: int
    conversation_title: str
    user_message: MessageItem
    assistant_message: MessageItem
