from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=False)

    # Academic Info
    college = Column(String(200))
    degree = Column(String(100))
    branch = Column(String(100))
    cgpa = Column(Float)

    # Preferences
    preferred_location = Column(String(100))
    interested_sector = Column(String(100))

    # Resume
    resume_path = Column(String(500))
    resume_status = Column(String(20), default="not_uploaded")  # not_uploaded | uploaded | parsed | confirmed

    # AI Extracted Fields (stored as JSON strings)
    extracted_skills = Column(Text)
    confirmed_skills = Column(Text)
    extracted_projects = Column(Text)
    extracted_certifications = Column(Text)
    extracted_tools = Column(Text)
    extracted_languages = Column(Text)
    extracted_experience = Column(Text)

    # AI Confirmation
    skills_confirmed = Column(Boolean, default=False)

    # Profile
    profile_completion = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    # Relationships
    applications = relationship("Application", back_populates="student")
    allocation = relationship("Allocation", back_populates="student", uselist=False)
