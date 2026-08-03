import json
import logging
from dataclasses import dataclass

from app.ai.matcher import MatchResult, calculate_match

logger = logging.getLogger(__name__)


@dataclass
class StudentProfile:
    id: int
    skills: list[str]
    degree: str
    branch: str
    cgpa: float | None
    preferred_location: str
    interested_sector: str


@dataclass
class InternshipProfile:
    id: int
    required_skills: list[str]
    preferred_degree: str
    preferred_branches: list[str]
    min_cgpa: float
    location: str
    sector: str
    seats: int


@dataclass
class AllocationRecord:
    student_id: int
    internship_id: int
    match_score: float
    skills_score: float
    degree_score: float
    branch_score: float
    cgpa_score: float
    location_score: float
    sector_score: float
    rank: int
    allocation_reason: str   # JSON string


def run_allocation(
    students: list[StudentProfile],
    internships: list[InternshipProfile],
) -> list[AllocationRecord]:
    """
    Core allocation algorithm using Gale-Shapley (Stable Marriage Problem) for fair global matching:
    1. Compute match score for every student × internship pair.
    2. Each student ranks internships by match score (and CGPA as tiebreaker).
    3. Each internship ranks students by match score (and CGPA as tiebreaker).
    4. Run Gale-Shapley algorithm where students propose to internships.
    5. Return stable allocation records.
    """
    # Step 1: Compute all match results
    student_matches: dict[int, dict[int, MatchResult]] = {s.id: {} for s in students}
    internship_matches: dict[int, dict[int, MatchResult]] = {i.id: {} for i in internships}

    for student in students:
        for internship in internships:
            result: MatchResult = calculate_match(
                student_skills=student.skills,
                student_degree=student.degree,
                student_branch=student.branch,
                student_cgpa=student.cgpa,
                student_location=student.preferred_location,
                student_sector=student.interested_sector,
                required_skills=internship.required_skills,
                preferred_degree=internship.preferred_degree,
                preferred_branches=internship.preferred_branches,
                min_cgpa=internship.min_cgpa,
                internship_location=internship.location,
                internship_sector=internship.sector,
            )
            student_matches[student.id][internship.id] = result
            internship_matches[internship.id][student.id] = result

    # Step 2: Build preference lists
    # Student preference list: sorted internships (desc by score, then student's CGPA)
    student_preferences: dict[int, list[int]] = {}
    for student in students:
        sorted_internships = sorted(
            internships,
            key=lambda i: (
                student_matches[student.id][i.id].overall_score,
                student.cgpa or 0.0
            ),
            reverse=True
        )
        student_preferences[student.id] = [i.id for i in sorted_internships]

    # Internship preference list: sorted students (desc by score, then student's CGPA)
    internship_preferences: dict[int, list[int]] = {}
    for internship in internships:
        sorted_students = sorted(
            students,
            key=lambda s: (
                internship_matches[internship.id][s.id].overall_score,
                s.cgpa or 0.0
            ),
            reverse=True
        )
        internship_preferences[internship.id] = [s.id for s in sorted_students]

    # Step 3: Gale-Shapley algorithm
    # Track: next internship each student will propose to
    next_proposal: dict[int, int] = {s.id: 0 for s in students}
    # Track: current allocations for each internship (list of student IDs, capped at seats)
    internship_allocations: dict[int, list[int]] = {i.id: [] for i in internships}
    # Track: which student is allocated to which internship
    student_allocation: dict[int, int | None] = {s.id: None for s in students}
    # All students start as free
    free_students = set(s.id for s in students)

    # Helper: get rank of a student in an internship's preference list
    def get_student_rank(internship_id: int, student_id: int) -> int:
        return internship_preferences[internship_id].index(student_id)

    while free_students:
        # Pick a free student
        student_id = free_students.pop()
        student_prefs = student_preferences[student_id]
        proposal_idx = next_proposal[student_id]

        if proposal_idx >= len(student_prefs):
            # Student has proposed to all internships, give up
            continue

        # Propose to next internship on list
        internship_id = student_prefs[proposal_idx]
        next_proposal[student_id] += 1
        current_alloc = internship_allocations[internship_id]
        internship = next(i for i in internships if i.id == internship_id)

        if len(current_alloc) < internship.seats:
            # Internship has seats left, accept the student
            current_alloc.append(student_id)
            student_allocation[student_id] = internship_id
        else:
            # Internship is full, compare with worst current student
            worst_student_id = current_alloc[-1]
            # Get ranks (lower is better)
            new_rank = get_student_rank(internship_id, student_id)
            worst_rank = get_student_rank(internship_id, worst_student_id)

            if new_rank < worst_rank:
                # New student is better, replace worst student
                current_alloc.pop()
                free_students.add(worst_student_id)
                student_allocation[worst_student_id] = None
                current_alloc.append(student_id)
                student_allocation[student_id] = internship_id
            else:
                # New student rejected, add back to free
                free_students.add(student_id)

    # Step 4: Build allocation records
    records: list[AllocationRecord] = []
    # For each internship, sort its allocated students by rank and create records
    for internship in internships:
        allocated_student_ids = internship_allocations[internship.id]
        # Sort allocated students by internship's preference list for ranking
        allocated_student_ids.sort(key=lambda s: get_student_rank(internship.id, s))
        for rank, student_id in enumerate(allocated_student_ids, 1):
            match_result = student_matches[student_id][internship.id]
            reason_payload = {
                "matched_skills": match_result.matched_skills,
                "unmatched_skills": match_result.unmatched_skills,
                "reasons": match_result.reasons,
            }
            records.append(AllocationRecord(
                student_id=student_id,
                internship_id=internship.id,
                match_score=match_result.overall_score,
                skills_score=match_result.skills_score,
                degree_score=match_result.degree_score,
                branch_score=match_result.branch_score,
                cgpa_score=match_result.cgpa_score,
                location_score=match_result.location_score,
                sector_score=match_result.sector_score,
                rank=rank,
                allocation_reason=json.dumps(reason_payload),
            ))
        logger.info(f"Internship {internship.id}: {len(allocated_student_ids)}/{internship.seats} seats filled.")

    logger.info(f"Allocation complete. Total allocated: {len(records)} students.")
    return records
