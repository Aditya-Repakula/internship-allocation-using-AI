from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)

    # Core details
    title = Column(String(200), nullable=False)          # renamed from 'role' for clarity
    description = Column(Text)
    required_skills = Column(Text, nullable=False)        # JSON: ["Python", "ML", ...]
    preferred_degree = Column(String(100))
    preferred_branches = Column(Text)                     # JSON: ["CSE", "AIML", ...]
    min_cgpa = Column(Float, default=0.0)
    location = Column(String(100))
    sector = Column(String(100))
    mode = Column(String(20), default="onsite")           # remote | hybrid | onsite
    seats = Column(Integer, nullable=False)
    duration = Column(String(50))

    # Application window
    application_start_date = Column(Date, nullable=True)
    application_deadline = Column(Date, nullable=True)

    # Lifecycle status
    # DRAFT → OPEN → CLOSED → ALLOCATING → ALLOCATED → RESULTS_PUBLISHED
    status = Column(String(30), default="draft")

    # Result visibility — admin must explicitly publish
    results_published = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("Application", back_populates="internship")
    allocations = relationship("Allocation", back_populates="internship")
