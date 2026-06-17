from pydantic import BaseModel, Field, field_validator

from app.schemas.validators import strip_required_text


class ChatSource(BaseModel):
    document_id: int
    title: str
    snippet: str


class MessageItem(BaseModel):
    id: int
    role: str
    content: str
    created_at: str
    sources: list[ChatSource] = Field(default_factory=list)


class ConversationListItem(BaseModel):
    id: int
    title: str
    updated_at: str


class ConversationDetail(BaseModel):
    id: int
    title: str
    updated_at: str
    messages: list[MessageItem] = Field(default_factory=list)


class ConversationUpdateRequest(BaseModel):
    title: str = Field(max_length=255)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return strip_required_text(value, field_name="Title")


class ConversationCreateRequest(BaseModel):
    title: str = Field(max_length=255)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return strip_required_text(value, field_name="Title")


class ConversationCreateData(BaseModel):
    id: int
    title: str
    updated_at: str
    messages: list[MessageItem] = Field(default_factory=list)
