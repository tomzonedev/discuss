from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import timedelta
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

from database import get_db, init_db
from models import User, Topic, TopicMember, Task, AuthLevel, TopicRole
from schemas import (
    UserCreate, UserUpdate, UserResponse, UserWithRole,
    LoginRequest, TokenResponse,
    TopicCreate, TopicUpdate, TopicResponse, TopicDetailResponse,
    TopicMemberAdd, TopicMemberResponse,
    TaskCreate, TaskUpdate, TaskResponse, TaskAssign
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, require_superuser, ACCESS_TOKEN_EXPIRE_MINUTES
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(
    title="Discussion Board API",
    description="A minimal discussion board with topics, tasks, and user management",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    # Create default superuser if not exists
    db = next(get_db())
    try:
        superuser = db.query(User).filter(User.email == "admin@example.com").first()
        if not superuser:
            superuser = User(
                name="Admin",
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                auth_level=AuthLevel.SUPERUSER.value
            )
            db.add(superuser)
            db.commit()
            logger.info("Default superuser created: admin@example.com / admin123")
    finally:
        db.close()

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse, tags=["Authentication"])
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        auth_level=AuthLevel.USER.value
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@api_router.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@api_router.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)

# ==================== USER ENDPOINTS ====================

@api_router.get("/users", response_model=List[UserResponse], tags=["Users"])
def get_users(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users (searchable by name or email)"""
    query = db.query(User)
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    users = query.all()
    return [UserResponse.model_validate(u) for u in users]

@api_router.get("/users/{user_id}", response_model=UserResponse, tags=["Users"])
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@api_router.put("/users/{user_id}", response_model=UserResponse, tags=["Users"])
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user (own profile or superuser can update any)"""
    if current_user.id != user_id and current_user.auth_level != AuthLevel.SUPERUSER.value:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Only superuser can change auth_level
    if "auth_level" in update_data and current_user.auth_level != AuthLevel.SUPERUSER.value:
        del update_data["auth_level"]
    
    for key, value in update_data.items():
        setattr(user, key, value.value if hasattr(value, 'value') else value)
    
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@api_router.delete("/users/{user_id}", tags=["Users"])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Delete a user (superuser only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# ==================== TOPIC ENDPOINTS ====================

@api_router.post("/topics", response_model=TopicResponse, tags=["Topics"])
def create_topic(
    topic_data: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new topic (creator becomes owner)"""
    topic = Topic(
        name=topic_data.name,
        description=topic_data.description,
        creator_id=current_user.id
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    
    # Add creator as owner
    member = TopicMember(
        topic_id=topic.id,
        user_id=current_user.id,
        role=TopicRole.OWNER.value
    )
    db.add(member)
    db.commit()
    
    response = TopicResponse.model_validate(topic)
    response.member_count = 1
    response.task_count = 0
    response.user_role = TopicRole.OWNER.value
    return response

@api_router.get("/topics", response_model=List[TopicResponse], tags=["Topics"])
def get_topics(
    search: Optional[str] = None,
    my_topics: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all topics (searchable, optionally filter by membership)"""
    query = db.query(Topic)
    
    if search:
        query = query.filter(
            or_(
                Topic.name.ilike(f"%{search}%"),
                Topic.description.ilike(f"%{search}%")
            )
        )
    
    if my_topics:
        query = query.join(TopicMember).filter(TopicMember.user_id == current_user.id)
    
    topics = query.all()
    
    result = []
    for topic in topics:
        member_count = db.query(TopicMember).filter(TopicMember.topic_id == topic.id).count()
        task_count = db.query(Task).filter(Task.topic_id == topic.id).count()
        user_membership = db.query(TopicMember).filter(
            TopicMember.topic_id == topic.id,
            TopicMember.user_id == current_user.id
        ).first()
        
        response = TopicResponse(
            id=topic.id,
            name=topic.name,
            description=topic.description,
            creator_id=topic.creator_id,
            created_at=topic.created_at,
            member_count=member_count,
            task_count=task_count,
            user_role=user_membership.role if user_membership else None
        )
        result.append(response)
    
    return result

@api_router.get("/topics/{topic_id}", response_model=TopicDetailResponse, tags=["Topics"])
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get topic details with members"""
    topic = db.query(Topic).options(
        joinedload(Topic.creator),
        joinedload(Topic.members).joinedload(TopicMember.user)
    ).filter(Topic.id == topic_id).first()
    
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    member_count = len(topic.members)
    task_count = db.query(Task).filter(Task.topic_id == topic.id).count()
    user_membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic.id,
        TopicMember.user_id == current_user.id
    ).first()
    
    members = [
        TopicMemberResponse(
            id=m.id,
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            user=UserResponse.model_validate(m.user)
        ) for m in topic.members
    ]
    
    return TopicDetailResponse(
        id=topic.id,
        name=topic.name,
        description=topic.description,
        creator_id=topic.creator_id,
        created_at=topic.created_at,
        member_count=member_count,
        task_count=task_count,
        user_role=user_membership.role if user_membership else None,
        creator=UserResponse.model_validate(topic.creator),
        members=members
    )

@api_router.put("/topics/{topic_id}", response_model=TopicResponse, tags=["Topics"])
def update_topic(
    topic_id: int,
    topic_data: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update topic (owner/admin only, superuser can update any)"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check permissions
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = membership and membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this topic")
    
    update_data = topic_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(topic, key, value)
    
    db.commit()
    db.refresh(topic)
    
    member_count = db.query(TopicMember).filter(TopicMember.topic_id == topic.id).count()
    task_count = db.query(Task).filter(Task.topic_id == topic.id).count()
    
    return TopicResponse(
        id=topic.id,
        name=topic.name,
        description=topic.description,
        creator_id=topic.creator_id,
        created_at=topic.created_at,
        member_count=member_count,
        task_count=task_count,
        user_role=membership.role if membership else None
    )

@api_router.delete("/topics/{topic_id}", tags=["Topics"])
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete topic (owner only, superuser can delete any)"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_owner = membership and membership.role == TopicRole.OWNER.value
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_owner and not is_superuser:
        raise HTTPException(status_code=403, detail="Only owner can delete topic")
    
    db.delete(topic)
    db.commit()
    return {"message": "Topic deleted successfully"}

# ==================== TOPIC MEMBER ENDPOINTS ====================

@api_router.post("/topics/{topic_id}/subscribe", response_model=TopicMemberResponse, tags=["Topic Members"])
def subscribe_to_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Subscribe to a topic"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    existing = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already subscribed to this topic")
    
    member = TopicMember(
        topic_id=topic_id,
        user_id=current_user.id,
        role=TopicRole.MEMBER.value
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return TopicMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user=UserResponse.model_validate(current_user)
    )

@api_router.delete("/topics/{topic_id}/unsubscribe", tags=["Topic Members"])
def unsubscribe_from_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unsubscribe from a topic"""
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=400, detail="Not subscribed to this topic")
    
    if membership.role == TopicRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Owner cannot unsubscribe. Transfer ownership or delete topic.")
    
    db.delete(membership)
    db.commit()
    return {"message": "Unsubscribed successfully"}

@api_router.post("/topics/{topic_id}/members", response_model=TopicMemberResponse, tags=["Topic Members"])
def add_member_to_topic(
    topic_id: int,
    member_data: TopicMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a user to topic (owner/admin only)"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check permissions
    current_membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = current_membership and current_membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to add members")
    
    # Check if user exists
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already member
    existing = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == member_data.user_id
    ).first()
    
    if existing:
        # Update role if different
        existing.role = member_data.role.value
        db.commit()
        db.refresh(existing)
        return TopicMemberResponse(
            id=existing.id,
            user_id=existing.user_id,
            role=existing.role,
            joined_at=existing.joined_at,
            user=UserResponse.model_validate(user)
        )
    
    member = TopicMember(
        topic_id=topic_id,
        user_id=member_data.user_id,
        role=member_data.role.value
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return TopicMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        user=UserResponse.model_validate(user)
    )

@api_router.delete("/topics/{topic_id}/members/{user_id}", tags=["Topic Members"])
def remove_member_from_topic(
    topic_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from topic (owner/admin only)"""
    # Check permissions
    current_membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = current_membership and current_membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to remove members")
    
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == topic_id,
        TopicMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if membership.role == TopicRole.OWNER.value:
        raise HTTPException(status_code=400, detail="Cannot remove owner")
    
    db.delete(membership)
    db.commit()
    return {"message": "Member removed successfully"}

# ==================== TASK ENDPOINTS ====================

@api_router.post("/tasks", response_model=TaskResponse, tags=["Tasks"])
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a task (topic owner/admin only)"""
    topic = db.query(Topic).filter(Topic.id == task_data.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check permissions
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == task_data.topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = membership and membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to create tasks")
    
    # If worker specified, verify they are a member
    if task_data.worker_id:
        worker_membership = db.query(TopicMember).filter(
            TopicMember.topic_id == task_data.topic_id,
            TopicMember.user_id == task_data.worker_id
        ).first()
        if not worker_membership:
            raise HTTPException(status_code=400, detail="Worker must be a topic member")
    
    task = Task(
        topic_id=task_data.topic_id,
        title=task_data.title,
        description=task_data.description,
        worker_id=task_data.worker_id,
        created_by_id=current_user.id,
        start_time=task_data.start_time,
        end_time=task_data.end_time
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    worker = None
    if task.worker_id:
        worker_user = db.query(User).filter(User.id == task.worker_id).first()
        worker = UserResponse.model_validate(worker_user) if worker_user else None
    
    return TaskResponse(
        id=task.id,
        topic_id=task.topic_id,
        title=task.title,
        description=task.description,
        worker_id=task.worker_id,
        created_by_id=task.created_by_id,
        start_time=task.start_time,
        end_time=task.end_time,
        status=task.status,
        created_at=task.created_at,
        worker=worker,
        topic_name=topic.name
    )

@api_router.get("/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tasks assigned to current user"""
    tasks = db.query(Task).filter(Task.worker_id == current_user.id).all()
    
    result = []
    for task in tasks:
        topic = db.query(Topic).filter(Topic.id == task.topic_id).first()
        worker = None
        if task.worker_id:
            worker_user = db.query(User).filter(User.id == task.worker_id).first()
            worker = UserResponse.model_validate(worker_user) if worker_user else None
        
        result.append(TaskResponse(
            id=task.id,
            topic_id=task.topic_id,
            title=task.title,
            description=task.description,
            worker_id=task.worker_id,
            created_by_id=task.created_by_id,
            start_time=task.start_time,
            end_time=task.end_time,
            status=task.status,
            created_at=task.created_at,
            worker=worker,
            topic_name=topic.name if topic else None
        ))
    
    return result

@api_router.get("/topics/{topic_id}/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def get_topic_tasks(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for a topic"""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    tasks = db.query(Task).filter(Task.topic_id == topic_id).all()
    
    result = []
    for task in tasks:
        worker = None
        if task.worker_id:
            worker_user = db.query(User).filter(User.id == task.worker_id).first()
            worker = UserResponse.model_validate(worker_user) if worker_user else None
        
        result.append(TaskResponse(
            id=task.id,
            topic_id=task.topic_id,
            title=task.title,
            description=task.description,
            worker_id=task.worker_id,
            created_by_id=task.created_by_id,
            start_time=task.start_time,
            end_time=task.end_time,
            status=task.status,
            created_at=task.created_at,
            worker=worker,
            topic_name=topic.name
        ))
    
    return result

@api_router.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get task details"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    topic = db.query(Topic).filter(Topic.id == task.topic_id).first()
    worker = None
    if task.worker_id:
        worker_user = db.query(User).filter(User.id == task.worker_id).first()
        worker = UserResponse.model_validate(worker_user) if worker_user else None
    
    return TaskResponse(
        id=task.id,
        topic_id=task.topic_id,
        title=task.title,
        description=task.description,
        worker_id=task.worker_id,
        created_by_id=task.created_by_id,
        start_time=task.start_time,
        end_time=task.end_time,
        status=task.status,
        created_at=task.created_at,
        worker=worker,
        topic_name=topic.name if topic else None
    )

@api_router.put("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update task (topic owner/admin or assigned worker can update status)"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == task.topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = membership and membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_worker = task.worker_id == current_user.id
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_worker and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    update_data = task_data.model_dump(exclude_unset=True)
    
    # Workers can only update status
    if is_worker and not is_admin and not is_superuser:
        update_data = {k: v for k, v in update_data.items() if k == "status"}
    
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    
    topic = db.query(Topic).filter(Topic.id == task.topic_id).first()
    worker = None
    if task.worker_id:
        worker_user = db.query(User).filter(User.id == task.worker_id).first()
        worker = UserResponse.model_validate(worker_user) if worker_user else None
    
    return TaskResponse(
        id=task.id,
        topic_id=task.topic_id,
        title=task.title,
        description=task.description,
        worker_id=task.worker_id,
        created_by_id=task.created_by_id,
        start_time=task.start_time,
        end_time=task.end_time,
        status=task.status,
        created_at=task.created_at,
        worker=worker,
        topic_name=topic.name if topic else None
    )

@api_router.delete("/tasks/{task_id}", tags=["Tasks"])
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete task (topic owner/admin only)"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == task.topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = membership and membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

@api_router.post("/tasks/{task_id}/assign", response_model=List[TaskResponse], tags=["Tasks"])
def assign_task_to_users(
    task_id: int,
    assign_data: TaskAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign/propagate task to multiple users (creates copies for each user)"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check permissions
    membership = db.query(TopicMember).filter(
        TopicMember.topic_id == task.topic_id,
        TopicMember.user_id == current_user.id
    ).first()
    
    is_admin = membership and membership.role in [TopicRole.OWNER.value, TopicRole.ADMIN.value]
    is_superuser = current_user.auth_level == AuthLevel.SUPERUSER.value
    
    if not is_admin and not is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to assign tasks")
    
    topic = db.query(Topic).filter(Topic.id == task.topic_id).first()
    created_tasks = []
    
    for worker_id in assign_data.worker_ids:
        # Verify worker is a topic member
        worker_membership = db.query(TopicMember).filter(
            TopicMember.topic_id == task.topic_id,
            TopicMember.user_id == worker_id
        ).first()
        
        if not worker_membership:
            continue
        
        new_task = Task(
            topic_id=task.topic_id,
            title=task.title,
            description=task.description,
            worker_id=worker_id,
            created_by_id=current_user.id,
            start_time=task.start_time,
            end_time=task.end_time
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        
        worker_user = db.query(User).filter(User.id == worker_id).first()
        worker = UserResponse.model_validate(worker_user) if worker_user else None
        
        created_tasks.append(TaskResponse(
            id=new_task.id,
            topic_id=new_task.topic_id,
            title=new_task.title,
            description=new_task.description,
            worker_id=new_task.worker_id,
            created_by_id=new_task.created_by_id,
            start_time=new_task.start_time,
            end_time=new_task.end_time,
            status=new_task.status,
            created_at=new_task.created_at,
            worker=worker,
            topic_name=topic.name if topic else None
        ))
    
    return created_tasks

# Root endpoint
@api_router.get("/", tags=["Health"])
async def root():
    return {"message": "Discussion Board API", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
