"""phase1_single_company_refactor

Revision ID: c1a2b3d4e5f6
Revises: 78d42e0a8693
Create Date: 2026-07-25 00:00:00.000000

Changes:
- Drop companies table (single-company architecture)
- Refactor internships: drop company_id FK, rename role→title,
  add application_start_date, expand status, add results_published, add timestamps
- Add applications table (student applies to internship)
- Refactor allocations: rename match_score→overall_match_score
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1a2b3d4e5f6"
down_revision: Union[str, None] = "78d42e0a8693"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Drop allocations (FK to internships) ───────────────────────────────
    op.drop_index("ix_allocations_id", table_name="allocations")
    op.drop_table("allocations")

    # ── 2. Drop internships (FK to companies) ─────────────────────────────────
    op.drop_index("ix_internships_id", table_name="internships")
    op.drop_table("internships")

    # ── 3. Drop companies ─────────────────────────────────────────────────────
    op.drop_index("ix_companies_email", table_name="companies")
    op.drop_index("ix_companies_id", table_name="companies")
    op.drop_table("companies")

    # ── 4. Create internships (no company_id, expanded status, new fields) ────
    op.create_table(
        "internships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("required_skills", sa.Text(), nullable=False),
        sa.Column("preferred_degree", sa.String(length=100), nullable=True),
        sa.Column("preferred_branches", sa.Text(), nullable=True),
        sa.Column("min_cgpa", sa.Float(), nullable=True),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("sector", sa.String(length=100), nullable=True),
        sa.Column("mode", sa.String(length=20), nullable=True),
        sa.Column("seats", sa.Integer(), nullable=False),
        sa.Column("duration", sa.String(length=50), nullable=True),
        sa.Column("application_start_date", sa.Date(), nullable=True),
        sa.Column("application_deadline", sa.Date(), nullable=True),
        # DRAFT | OPEN | CLOSED | ALLOCATING | ALLOCATED | RESULTS_PUBLISHED
        sa.Column("status", sa.String(length=30), nullable=True),
        sa.Column("results_published", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_internships_id"), "internships", ["id"], unique=False)

    # ── 5. Create applications table ──────────────────────────────────────────
    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("internship_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("applied_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["internship_id"], ["internships.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id", "internship_id", name="uq_student_internship"),
    )
    op.create_index(op.f("ix_applications_id"), "applications", ["id"], unique=False)
    op.create_index(op.f("ix_applications_student_id"), "applications", ["student_id"], unique=False)
    op.create_index(op.f("ix_applications_internship_id"), "applications", ["internship_id"], unique=False)

    # ── 6. Create allocations (overall_match_score replaces match_score) ──────
    op.create_table(
        "allocations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("internship_id", sa.Integer(), nullable=False),
        sa.Column("overall_match_score", sa.Float(), nullable=False),
        sa.Column("skills_score", sa.Float(), nullable=True),
        sa.Column("degree_score", sa.Float(), nullable=True),
        sa.Column("branch_score", sa.Float(), nullable=True),
        sa.Column("cgpa_score", sa.Float(), nullable=True),
        sa.Column("location_score", sa.Float(), nullable=True),
        sa.Column("sector_score", sa.Float(), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("allocation_reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("allocated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["internship_id"], ["internships.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id"),
    )
    op.create_index(op.f("ix_allocations_id"), "allocations", ["id"], unique=False)


def downgrade() -> None:
    # ── Reverse: drop new tables ──────────────────────────────────────────────
    op.drop_index(op.f("ix_allocations_id"), table_name="allocations")
    op.drop_table("allocations")

    op.drop_index(op.f("ix_applications_internship_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_student_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_id"), table_name="applications")
    op.drop_table("applications")

    op.drop_index(op.f("ix_internships_id"), table_name="internships")
    op.drop_table("internships")

    # ── Restore companies ─────────────────────────────────────────────────────
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("industry", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_companies_email"), "companies", ["email"], unique=True)
    op.create_index(op.f("ix_companies_id"), "companies", ["id"], unique=False)

    # ── Restore old internships ───────────────────────────────────────────────
    op.create_table(
        "internships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("required_skills", sa.Text(), nullable=False),
        sa.Column("preferred_degree", sa.String(length=100), nullable=True),
        sa.Column("preferred_branches", sa.Text(), nullable=True),
        sa.Column("min_cgpa", sa.Float(), nullable=True),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("sector", sa.String(length=100), nullable=True),
        sa.Column("mode", sa.String(length=20), nullable=True),
        sa.Column("seats", sa.Integer(), nullable=False),
        sa.Column("duration", sa.String(length=50), nullable=True),
        sa.Column("application_deadline", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_internships_id"), "internships", ["id"], unique=False)

    # ── Restore old allocations ───────────────────────────────────────────────
    op.create_table(
        "allocations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("internship_id", sa.Integer(), nullable=False),
        sa.Column("match_score", sa.Float(), nullable=False),
        sa.Column("skills_score", sa.Float(), nullable=True),
        sa.Column("degree_score", sa.Float(), nullable=True),
        sa.Column("branch_score", sa.Float(), nullable=True),
        sa.Column("cgpa_score", sa.Float(), nullable=True),
        sa.Column("location_score", sa.Float(), nullable=True),
        sa.Column("sector_score", sa.Float(), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("allocation_reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("allocated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["internship_id"], ["internships.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id"),
    )
    op.create_index(op.f("ix_allocations_id"), "allocations", ["id"], unique=False)
