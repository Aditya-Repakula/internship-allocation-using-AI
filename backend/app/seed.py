"""
Seed demo data for local development.

Usage (from backend/ with venv active):
    python -m app.seed

Creates:
  - 1 admin  (admin@company.com / admin123)
  - 3 students with confirmed skills
  - 3 open internship announcements
"""
import asyncio
import logging
from datetime import date, timedelta

from sqlalchemy import select

from app.ai.utils import to_json
from app.core.database import AsyncSessionLocal
from app.models.admin import Admin
from app.models.internship import Internship
from app.models.student import Student
from app.utils.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

ADMIN = {
    "name": "Company Admin",
    "email": "admin@company.com",
    "password": "admin123",
}

STUDENTS = [
    {
        "name": "Aditya Sharma",
        "email": "aditya@student.com",
        "password": "student123",
        "phone": "9000000001",
        "college": "ABC Institute of Technology",
        "degree": "B.Tech",
        "branch": "AIML",
        "cgpa": 8.7,
        "preferred_location": "Bangalore",
        "interested_sector": "AI/ML",
        "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Pandas"],
    },
    {
        "name": "Priya Nair",
        "email": "priya@student.com",
        "password": "student123",
        "phone": "9000000002",
        "college": "ABC Institute of Technology",
        "degree": "B.Tech",
        "branch": "CSE",
        "cgpa": 8.2,
        "preferred_location": "Bangalore",
        "interested_sector": "Data Science",
        "skills": ["Python", "SQL", "Excel", "Tableau", "Statistics"],
    },
    {
        "name": "Rahul Verma",
        "email": "rahul@student.com",
        "password": "student123",
        "phone": "9000000003",
        "college": "XYZ Engineering College",
        "degree": "B.Tech",
        "branch": "CSE",
        "cgpa": 7.5,
        "preferred_location": "Hyderabad",
        "interested_sector": "Web Development",
        "skills": ["JavaScript", "React", "Node.js", "HTML", "CSS", "MongoDB"],
    },
]

DEADLINE = date.today() + timedelta(days=30)

INTERNSHIPS = [
    {
        "title": "AI/ML Intern",
        "description": "Build and evaluate ML models for product features.",
        "required_skills": ["Python", "Machine Learning", "SQL", "TensorFlow"],
        "preferred_degree": "B.Tech",
        "preferred_branches": ["CSE", "AIML", "ECE"],
        "min_cgpa": 7.0,
        "location": "Bangalore",
        "mode": "onsite",
        "sector": "AI/ML",
        "duration": "3 months",
        "seats": 2,
    },
    {
        "title": "Data Analyst Intern",
        "description": "Analyze datasets and build dashboards for business insights.",
        "required_skills": ["Python", "SQL", "Excel", "Tableau"],
        "preferred_degree": "B.Tech",
        "preferred_branches": ["CSE", "AIML", "IT"],
        "min_cgpa": 6.5,
        "location": "Bangalore",
        "mode": "hybrid",
        "sector": "Data Science",
        "duration": "3 months",
        "seats": 2,
    },
    {
        "title": "Web Development Intern",
        "description": "Build responsive web applications with modern JS frameworks.",
        "required_skills": ["JavaScript", "React", "Node.js", "HTML", "CSS"],
        "preferred_degree": "B.Tech",
        "preferred_branches": ["CSE", "IT"],
        "min_cgpa": 6.0,
        "location": "Hyderabad",
        "mode": "remote",
        "sector": "Web Development",
        "duration": "2 months",
        "seats": 2,
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # Admin (single)
        existing_admin = await db.execute(select(Admin).limit(1))
        if existing_admin.scalar_one_or_none():
            logger.info("Admin already exists — skipping admin seed")
        else:
            db.add(
                Admin(
                    name=ADMIN["name"],
                    email=ADMIN["email"],
                    password_hash=hash_password(ADMIN["password"]),
                )
            )
            logger.info("Created admin: %s / %s", ADMIN["email"], ADMIN["password"])

        # Students
        for s in STUDENTS:
            found = await db.execute(select(Student).where(Student.email == s["email"]))
            if found.scalar_one_or_none():
                logger.info("Student exists: %s", s["email"])
                continue
            db.add(
                Student(
                    name=s["name"],
                    email=s["email"],
                    phone=s["phone"],
                    password_hash=hash_password(s["password"]),
                    college=s["college"],
                    degree=s["degree"],
                    branch=s["branch"],
                    cgpa=s["cgpa"],
                    preferred_location=s["preferred_location"],
                    interested_sector=s["interested_sector"],
                    extracted_skills=to_json(s["skills"]),
                    confirmed_skills=to_json(s["skills"]),
                    skills_confirmed=True,
                    resume_status="confirmed",
                    profile_completion=90.0,
                )
            )
            logger.info("Created student: %s / %s", s["email"], s["password"])

        # Internships
        existing_count = await db.execute(select(Internship))
        if list(existing_count.scalars().all()):
            logger.info("Internships already exist — skipping internship seed")
        else:
            for i in INTERNSHIPS:
                db.add(
                    Internship(
                        title=i["title"],
                        description=i["description"],
                        required_skills=to_json(i["required_skills"]),
                        preferred_degree=i["preferred_degree"],
                        preferred_branches=to_json(i["preferred_branches"]),
                        min_cgpa=i["min_cgpa"],
                        location=i["location"],
                        mode=i["mode"],
                        sector=i["sector"],
                        duration=i["duration"],
                        seats=i["seats"],
                        application_start_date=date.today(),
                        application_deadline=DEADLINE,
                        status="open",
                        results_published=False,
                    )
                )
                logger.info("Created internship: %s (%s seats)", i["title"], i["seats"])

        await db.commit()
        logger.info("Seed complete.")
        logger.info("--- Login credentials ---")
        logger.info("Company: %s / %s", ADMIN["email"], ADMIN["password"])
        for s in STUDENTS:
            logger.info("Student: %s / %s", s["email"], s["password"])


if __name__ == "__main__":
    asyncio.run(seed())
