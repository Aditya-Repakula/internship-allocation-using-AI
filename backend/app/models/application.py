from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id"), nullable=False, index=True)

    # Application lifecycle: pending | withdrawn | allocated | not_allocated
    status = Column(String(20), default="pending")

    # Path of the primary resume used at apply time (one resume per student)
    resume_used = Column(String(500), nullable=True)

    applied_at = Column(DateTime, default=datetime.utcnow)

    # Enforce: one student can apply only once per internship
    __table_args__ = (
        UniqueConstraint("student_id", "internship_id", name="uq_student_internship"),
    )

    student = relationship("Student", back_populates="applications")
    internship = relationship("Internship", back_populates="applications")
