from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AuthLevel(str, Enum):
    SUPERUSER = "superuser"
    USER = "user"

class TopicRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

# User Schemas
class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    auth_level: Optional[AuthLevel] = None

class UserResponse(UserBase):
    id: int
    auth_level: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserWithRole(UserResponse):
    role: str

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Topic Schemas
class TopicBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class TopicUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TopicResponse(TopicBase):
    id: int
    creator_id: int
    created_at: datetime
    member_count: int = 0
    task_count: int = 0
    user_role: Optional[str] = None
    
    class Config:
        from_attributes = True

class TopicDetailResponse(TopicResponse):
    creator: UserResponse
    members: List["TopicMemberResponse"] = []

# Topic Member Schemas
class TopicMemberAdd(BaseModel):
    user_id: int
    role: TopicRole = TopicRole.MEMBER

class TopicMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class TaskCreate(TaskBase):
    topic_id: int
    worker_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    worker_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None

class TaskAssign(BaseModel):
    worker_ids: List[int]

class TaskResponse(TaskBase):
    id: int
    topic_id: int
    worker_id: Optional[int]
    created_by_id: int
    status: str
    created_at: datetime
    worker: Optional[UserResponse] = None
    topic_name: Optional[str] = None
    
    class Config:
        from_attributes = True
