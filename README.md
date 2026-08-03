# Smart Internship Allocation System

AI-powered internship matching and allocation system — B.Tech AIML Minor Project.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React.js                                |
| Backend    | FastAPI (Python)                        |
| Database   | PostgreSQL                              |
| AI/NLP     | spaCy, Sentence Transformers, PyMuPDF  |
| Auth       | JWT                                     |

---

## Project Structure

```
code work/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # API route handlers
│   │   ├── core/              # Config, database engine
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic layer
│   │   ├── ai/                # Resume parser, matcher, allocator
│   │   ├── utils/             # Shared utilities
│   │   └── main.py            # FastAPI app entry point
│   ├── alembic/               # Database migrations
│   ├── uploads/               # Uploaded resumes (PDF)
│   ├── requirements.txt
│   └── .env
└── frontend/
    └── src/
        ├── components/        # Reusable UI components
        ├── pages/
        │   ├── student/       # Student dashboard pages
        │   └── company/       # Company dashboard pages
        ├── services/          # Axios API calls
        ├── context/           # Auth context (JWT)
        └── utils/
```

---

## Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download spaCy model
python -m spacy download en_core_web_md

# 4. Configure environment
# Edit .env with your PostgreSQL credentials

# 5. Run database migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head

# 6. Start the server
uvicorn app.main:app --reload
```

API docs available at: http://localhost:8000/docs

---

## Frontend Setup

```bash
cd frontend

# 1. Create React app (if not done)
npx create-react-app . --template typescript

# 2. Install dependencies
npm install axios react-router-dom @types/react-router-dom

# 3. Start dev server
npm start
```

---

## Core Workflow

```
Student uploads resume (PDF)
        ↓
AI extracts skills, projects, certifications
        ↓
Student reviews & confirms extracted skills
        ↓
AI Matching Engine (Sentence Transformers + Cosine Similarity)
        ↓
Allocation Engine (top-N students per internship seat count)
        ↓
Results shown on Student & Company dashboards
```

---

## Build Modules (in order)

- [x] Module 1 — Project Architecture & Database Schema
- [x] Module 2 — Authentication (JWT)
- [x] Module 3 — Student Module
- [x] Module 4 — Company Module
- [x] Module 5 — Resume Parser (AI)
- [x] Module 6 — AI Matching Engine
- [x] Module 7 — Allocation Engine
- [x] Module 8 — Frontend (React)
- [x] Module 9 — Integration & Testing

---

## Running Tests

```bash
cd backend
venv\Scripts\activate
python -m pytest tests/ -v
```

### Test Coverage Summary

| Test File           | What It Covers                                      | Tests |
|---------------------|-----------------------------------------------------|-------|
| `test_auth.py`      | Register, login, duplicate email, wrong password    | 6     |
| `test_student.py`   | Profile CRUD, skill confirm, resume extracted data  | 8     |
| `test_company.py`   | Internship CRUD, close, dashboard, 404 guard        | 11    |
| `test_admin.py`     | Admin auth, list students/companies/internships     | 5     |
| `test_allocation.py`| Full allocation flow, role guards, score validation | 7     |
| `test_ai_unit.py`   | AI unit tests: parser, matcher, allocation engine   | 16    |
| **Total**           |                                                     | **53**|
