from pydantic import BaseModel, Field

from app.schemas.conversations import ChatSource, MessageItem


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    conversation_id: int | None = None


class ChatResponseData(BaseModel):
    answer: str
    sources: list[ChatSource] = Field(default_factory=list)
    conversation_id: int
    conversation_title: str
    user_message: MessageItem
    assistant_message: MessageItem
