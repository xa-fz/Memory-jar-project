from pydantic import BaseModel, Field


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
    title: str = Field(min_length=1, max_length=255)


class ConversationCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ConversationCreateData(BaseModel):
    id: int
    title: str
    updated_at: str
    messages: list[MessageItem] = Field(default_factory=list)
