# Task Manager API

A scalable REST API with JWT Authentication, Role-Based Access Control, and Redis caching.
Built with FastAPI, PostgreSQL, and React.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (async), Python 3.12 |
| Database | PostgreSQL + SQLAlchemy (async) |
| Auth | JWT (python-jose) + bcrypt |
| Caching | Redis |
| Frontend | React + Vite + Axios |
| Docs | Swagger UI (auto-generated) |

---

## Features

- User registration & login with bcrypt password hashing
- JWT-based authentication with expiry
- Role-based access control (user vs admin)
- CRUD APIs for Tasks (Create, Read, Update, Delete)
- Redis caching for GET requests (Cache-Aside pattern)
- API versioning (`/api/v1/`)
- Request logging to file (`logs/app.log`)
- Swagger UI documentation
- Protected React frontend with role-aware dashboard

---

## Project Structure

```
task-manager-api/
├── backend/
│   ├── app/
│   │   ├── main.py          # App entry point, middleware
│   │   ├── config.py        # Environment config
│   │   ├── database.py      # Async DB connection
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── cache.py         # Redis cache helpers
│   │   ├── logger.py        # Logging setup
│   │   └── routes/
│   │       ├── auth.py      # /register, /login
│   │       └── tasks.py     # CRUD + admin routes
│   ├── logs/                # Auto-generated log files
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/axios.js     # Axios config + interceptors
│   │   ├── pages/           # Register, Login, Dashboard
│   │   └── components/      # ProtectedRoute
│   └── package.json
├── scalability_note.md
└── README.md
```

---

## Setup & Run

### Prerequisites
- Python 3.12+
- PostgreSQL
- Redis
- Node.js 18+

### Backend

```bash
# 1. Clone the repo
git clone https://github.com/DishaJaipal/task-manager-api.git
cd task-manager-api/backend

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, REDIS_URL

# 5. Start Redis
sudo service redis-server start   # Linux/WSL

# 6. Run the server
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd task-manager-api/frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login, returns JWT |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/tasks/` | User | Get own tasks (cached) |
| POST | `/api/v1/tasks/` | User | Create task |
| PUT | `/api/v1/tasks/{id}` | User | Update own task |
| DELETE | `/api/v1/tasks/{id}` | User | Delete own task |
| GET | `/api/v1/tasks/all` | Admin only | Get all tasks |

---

## Environment Variables

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/taskdb
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379/0
```



## API Documentation

Swagger UI available at `/docs` when running locally.
Postman collection included in `/postman/task_manager.postman_collection.json`
