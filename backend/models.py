from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import enum

class AuthLevel(str, enum.Enum):
    SUPERUSER = "superuser"
    USER = "user"

class TopicRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    auth_level = Column(String(20), default=AuthLevel.USER.value)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    created_topics = relationship("Topic", back_populates="creator", foreign_keys="Topic.creator_id")
    topic_memberships = relationship("TopicMember", back_populates="user")
    assigned_tasks = relationship("Task", back_populates="worker", foreign_keys="Task.worker_id")

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    creator = relationship("User", back_populates="created_topics", foreign_keys=[creator_id])
    members = relationship("TopicMember", back_populates="topic", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="topic", cascade="all, delete-orphan")

class TopicMember(Base):
    __tablename__ = "topic_members"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default=TopicRole.MEMBER.value)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    topic = relationship("Topic", back_populates="members")
    user = relationship("User", back_populates="topic_memberships")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    topic = relationship("Topic", back_populates="tasks")
    worker = relationship("User", back_populates="assigned_tasks", foreign_keys=[worker_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
