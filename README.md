# Smart Internship Allocation System

AI-powered **single-company** internship matching and allocation — B.Tech AIML Minor Project.

There is one company/admin organization that announces multiple internships. Students apply; the AI engine matches and allocates. The company reviews and publishes results.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React.js (Vite)                         |
| Backend    | FastAPI (Python)                        |
| Database   | PostgreSQL                              |
| AI/NLP     | spaCy, Sentence Transformers, PyMuPDF   |
| Auth       | JWT (Student + Admin)                   |

---

## Roles

1. **Company / Admin** — create internships, close applications, run AI allocation, publish results  
2. **Student** — register, profile, resume, apply to internships, view published result  

---

## Core Workflow

```
Admin creates & opens internship announcements
        ↓
Student registers → profile → resume parse → confirm skills
        ↓
Student applies to one or more open internships
        ↓
Admin closes applications (after deadline)
        ↓
Admin clicks "Run AI Allocation" (manual — never auto)
        ↓
AI matching + seat-limited allocation (1 student → 1 internship)
        ↓
Admin reviews rankings / scores
        ↓
Admin clicks "Publish Results"
        ↓
Students see final allocation
```

---

## Project Structure

```
code work/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # auth, student, admin
│   │   ├── models/         # Student, Internship, Application, Allocation, Admin
│   │   ├── services/       # business logic
│   │   ├── ai/             # resume parser, matcher, allocation engine
│   │   └── main.py
│   ├── alembic/
│   └── tests/
└── frontend-app/
    └── src/pages/
        ├── student/        # dashboard, profile, resume, internships, applications, result
        └── admin/          # dashboard, internships, allocations
```

---

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_md
# Configure .env (DATABASE_URL, SECRET_KEY)
alembic upgrade head
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

Create the single admin once:

```http
POST /api/auth/admin/register
{ "name": "...", "email": "...", "password": "..." }
```

Further admin registrations are rejected (one company/admin only).

---

## Frontend Setup

```bash
cd frontend-app
npm install
npm run dev
```

Login tabs: **Student** | **Company** (Company maps to admin auth).

---

## Seed Demo Data

```bash
cd backend
venv\Scripts\activate
alembic upgrade head
python -m app.seed
```

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Company | admin@company.com   | admin123    |
| Student | aditya@student.com  | student123  |
| Student | priya@student.com   | student123  |
| Student | rahul@student.com   | student123  |

Three open internships are created (AI/ML, Data Analyst, Web Development) with a 30-day deadline.

---

## Running Tests

```bash
cd backend
venv\Scripts\activate
python -m pytest tests/ -v
```
