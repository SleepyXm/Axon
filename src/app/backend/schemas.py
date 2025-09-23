from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class MessageCreate(BaseModel):
    message: str
    role: str  # 'user' or 'assistant'

class MessageOut(BaseModel):
    id: str
    message: str
    role: str
    created_at: datetime

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    username: str
    password: str
    hf_token: Optional[list[str]] = []  # Will store encrypted token

class UserLogin(BaseModel):
    username: str
    password: str

class HFTokenRequest(BaseModel):
    hf_token: str

class UserOut(BaseModel):
    id: str
    username: str
    password: str
    created_at: datetime

    class Config:
        orm_mode = True

class FavLLM(BaseModel):
    hf_id: str

class AddLLMRequest(BaseModel):
    llm_id: str
    llm_name: str

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    modelId: str
    conversation: list[Message]