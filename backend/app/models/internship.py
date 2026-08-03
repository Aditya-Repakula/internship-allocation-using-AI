from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    role = Column(String(200), nullable=False)
    description = Column(Text)
    required_skills = Column(Text, nullable=False)  # JSON: ["Python", "ML", ...]
    preferred_degree = Column(String(100))
    preferred_branches = Column(Text)               # JSON: ["CSE", "AIML", ...]
    min_cgpa = Column(Float, default=0.0)
    location = Column(String(100))
    sector = Column(String(100))
    mode = Column(String(20), default="onsite")     # remote | hybrid | onsite
    seats = Column(Integer, nullable=False)
    duration = Column(String(50))                   # e.g. "2 months"
    application_deadline = Column(Date, nullable=True)
    status = Column(String(20), default="open")     # open | closed

    company = relationship("Company", back_populates="internships")
    allocations = relationship("Allocation", back_populates="internship")
