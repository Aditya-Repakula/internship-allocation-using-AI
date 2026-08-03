from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    internship_id = Column(Integer, ForeignKey("internships.id"), nullable=False)

    # AI Scores
    match_score = Column(Float, nullable=False)          # overall weighted score 0-100
    skills_score = Column(Float, default=0.0)
    degree_score = Column(Float, default=0.0)
    branch_score = Column(Float, default=0.0)
    cgpa_score = Column(Float, default=0.0)
    location_score = Column(Float, default=0.0)
    sector_score = Column(Float, default=0.0)

    rank = Column(Integer)                               # rank among all students for this internship
    allocation_reason = Column(Text)                     # JSON: matched/unmatched reasons

    status = Column(String(20), default="allocated")     # allocated | completed | cancelled
    allocated_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="allocation")
    internship = relationship("Internship", back_populates="allocations")
