import json
import logging
from dataclasses import dataclass

from app.ai.matcher import MatchResult, calculate_match
from app.ai.preprocessing import normalize_skill

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
    allocation_reason: str  # JSON string


def _is_eligible(student: StudentProfile, internship: InternshipProfile) -> bool:
    """Hard eligibility: CGPA minimum and preferred branch (if set)."""
    if internship.min_cgpa and internship.min_cgpa > 0:
        if student.cgpa is None or student.cgpa < internship.min_cgpa:
            return False

    if internship.preferred_branches:
        student_branch = normalize_skill(student.branch)
        allowed = {normalize_skill(b) for b in internship.preferred_branches}
        if student_branch not in allowed:
            if not any(
                student_branch == a or student_branch in a or a in student_branch
                for a in allowed
                if a
            ):
                return False

    return True


def run_allocation(
    students: list[StudentProfile],
    internships: list[InternshipProfile],
    allowed_pairs: dict[int, set[int]] | None = None,
) -> list[AllocationRecord]:
    """
    Seat-limited allocation with multi-internship conflict resolution.

    1. Hard-filter ineligible pairs (CGPA / branch).
    2. Score remaining pairs with the weighted matcher.
    3. Optionally restrict to applications via allowed_pairs.
    4. Gale-Shapley stable matching (students propose) honouring seat caps.
    5. One student → at most one internship.

    Tie-break: higher overall score, then higher CGPA.
    """
    student_matches: dict[int, dict[int, MatchResult]] = {s.id: {} for s in students}
    internship_matches: dict[int, dict[int, MatchResult]] = {i.id: {} for i in internships}

    for student in students:
        for internship in internships:
            if allowed_pairs is not None:
                allowed = allowed_pairs.get(student.id, set())
                if internship.id not in allowed:
                    continue

            if not _is_eligible(student, internship):
                continue

            result = calculate_match(
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

    student_preferences: dict[int, list[int]] = {}
    for student in students:
        scored = list(student_matches[student.id].items())
        scored.sort(
            key=lambda pair: (pair[1].overall_score, student.cgpa or 0.0),
            reverse=True,
        )
        student_preferences[student.id] = [iid for iid, _ in scored]

    students_by_id = {s.id: s for s in students}
    internship_preferences: dict[int, list[int]] = {}
    for internship in internships:
        scored = list(internship_matches[internship.id].items())
        scored.sort(
            key=lambda pair: (
                pair[1].overall_score,
                students_by_id[pair[0]].cgpa or 0.0,
            ),
            reverse=True,
        )
        internship_preferences[internship.id] = [sid for sid, _ in scored]

    next_proposal: dict[int, int] = {s.id: 0 for s in students}
    internship_allocations: dict[int, list[int]] = {i.id: [] for i in internships}
    student_allocation: dict[int, int | None] = {s.id: None for s in students}
    free_students = {s.id for s in students if student_preferences.get(s.id)}

    def get_student_rank(internship_id: int, student_id: int) -> int:
        prefs = internship_preferences[internship_id]
        return prefs.index(student_id) if student_id in prefs else 10**9

    def sort_current_alloc(internship_id: int) -> None:
        internship_allocations[internship_id].sort(
            key=lambda sid: get_student_rank(internship_id, sid)
        )

    while free_students:
        student_id = free_students.pop()
        prefs = student_preferences.get(student_id, [])
        proposal_idx = next_proposal[student_id]

        if proposal_idx >= len(prefs):
            continue

        internship_id = prefs[proposal_idx]
        next_proposal[student_id] += 1
        current_alloc = internship_allocations[internship_id]
        internship = next(i for i in internships if i.id == internship_id)

        if len(current_alloc) < internship.seats:
            current_alloc.append(student_id)
            sort_current_alloc(internship_id)
            student_allocation[student_id] = internship_id
        else:
            worst_student_id = current_alloc[-1]
            new_rank = get_student_rank(internship_id, student_id)
            worst_rank = get_student_rank(internship_id, worst_student_id)

            if new_rank < worst_rank:
                current_alloc.pop()
                free_students.add(worst_student_id)
                student_allocation[worst_student_id] = None
                current_alloc.append(student_id)
                sort_current_alloc(internship_id)
                student_allocation[student_id] = internship_id
            else:
                free_students.add(student_id)

    records: list[AllocationRecord] = []
    for internship in internships:
        allocated_ids = list(internship_allocations[internship.id])
        allocated_ids.sort(key=lambda sid: get_student_rank(internship.id, sid))
        for rank, student_id in enumerate(allocated_ids, 1):
            match_result = student_matches[student_id][internship.id]
            reason_payload = {
                "matched_skills": match_result.matched_skills,
                "unmatched_skills": match_result.unmatched_skills,
                "reasons": match_result.reasons,
                "eligibility": {
                    "degree": "Eligible" if match_result.degree_score >= 80 else "Mismatch",
                    "branch": "Eligible" if match_result.branch_score >= 80 else "Mismatch",
                    "cgpa": "Eligible" if match_result.cgpa_score >= 100 else "Below minimum",
                    "location": "Match" if match_result.location_score >= 70 else "Partial",
                },
            }
            records.append(
                AllocationRecord(
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
                )
            )
        logger.info(
            "Internship %s: %s/%s seats filled.",
            internship.id,
            len(allocated_ids),
            internship.seats,
        )

    logger.info("Allocation complete. Total allocated: %s students.", len(records))
    return records
