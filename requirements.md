# Discussion Board Application - Requirements & Architecture

## Original Problem Statement
Discussion board web application with minimal approach. Backend is FastAPI REST based, Frontend React with Bootstrap colors and minimal aesthetic.

## System Functions Implemented
- **User Management** with AAA paradigm (Authentication, Authorization, Accounting)
- **JWT Authentication** for login
- **Superuser** - master admin - can manage everything
- **Topic Management**:
  - Users can create topics
  - Topic creator is admin for their topics
  - Topic creator can add other admins
  - Topic creator can add members
  - Users can subscribe/unsubscribe to topics
  - Search functionality for topics
- **Task Management**:
  - Topic admins can create tasks
  - Task assignment with time schedules (start_time, end_time)
  - Propagate tasks to multiple users
  - Delegate tasks to specific users
  - Users can view their assigned tasks

## Data Models (SQLite with SQLAlchemy)

### User
- id (primary key)
- name
- email (unique)
- phone (optional)
- password_hash
- auth_level (superuser/user)
- created_at

### Topic
- id (primary key)
- name
- description
- creator_id (foreign key to User)
- created_at

### TopicMember
- id (primary key)
- topic_id (foreign key to Topic)
- user_id (foreign key to User)
- role (owner/admin/member)
- joined_at

### Task
- id (primary key)
- topic_id (foreign key to Topic)
- title
- description
- worker_id (foreign key to User)
- created_by_id (foreign key to User)
- start_time
- end_time
- status (pending/in_progress/completed)
- created_at

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login and get JWT token
- GET /api/auth/me - Get current user profile

### Users
- GET /api/users - List all users (with search)
- GET /api/users/{id} - Get user by ID
- PUT /api/users/{id} - Update user
- DELETE /api/users/{id} - Delete user (superuser only)

### Topics
- GET /api/topics - List topics (with search, my_topics filter)
- POST /api/topics - Create topic
- GET /api/topics/{id} - Get topic details
- PUT /api/topics/{id} - Update topic
- DELETE /api/topics/{id} - Delete topic

### Topic Members
- POST /api/topics/{id}/subscribe - Subscribe to topic
- DELETE /api/topics/{id}/unsubscribe - Unsubscribe
- POST /api/topics/{id}/members - Add member
- DELETE /api/topics/{id}/members/{user_id} - Remove member

### Tasks
- GET /api/tasks - Get my assigned tasks
- POST /api/tasks - Create task
- GET /api/tasks/{id} - Get task details
- PUT /api/tasks/{id} - Update task
- DELETE /api/tasks/{id} - Delete task
- POST /api/tasks/{id}/assign - Assign to multiple users
- GET /api/topics/{id}/tasks - Get topic tasks

## Frontend Pages
- Login/Register Page
- Dashboard (user's topics and tasks overview)
- Topics List (with search and filter)
- Topic Detail (members, tasks, CRUD operations)
- Create Topic Page
- Tasks Page (assigned tasks with status management)
- Admin Panel (user management for superuser)
- Profile Page

## Tech Stack
- **Backend**: FastAPI + SQLite + SQLAlchemy
- **Frontend**: React + Tailwind CSS
- **Authentication**: JWT
- **API Documentation**: Swagger UI at /docs

## Default Credentials
- **Superuser**: admin@example.com / admin123

## Next Tasks
1. Add pagination for topics and tasks lists
2. Implement task comments/discussions
3. Add email notifications for task assignments
4. Implement file attachments for topics/tasks
5. Add real-time updates with WebSockets
6. Implement task due date reminders
7. Add activity log/audit trail
8. Implement user avatar uploads
