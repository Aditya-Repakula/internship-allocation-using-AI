import logging
from dataclasses import dataclass, field

import numpy as np

from app.ai.embeddings import cosine_similarity, embed
from app.ai.preprocessing import normalize_skill

logger = logging.getLogger(__name__)

# Scoring weights — must sum to 1.0
WEIGHTS = {
    "skills": 0.50,
    "degree": 0.15,
    "branch": 0.10,
    "cgpa": 0.10,
    "location": 0.10,
    "sector": 0.05,
}


@dataclass
class MatchResult:
    overall_score: float                        # 0-100
    skills_score: float = 0.0
    degree_score: float = 0.0
    branch_score: float = 0.0
    cgpa_score: float = 0.0
    location_score: float = 0.0
    sector_score: float = 0.0
    matched_skills: list[str] = field(default_factory=list)
    unmatched_skills: list[str] = field(default_factory=list)
    reasons: list[str] = field(default_factory=list)


def _semantic_skill_score(student_skills: list[str], required_skills: list[str]) -> tuple[float, list[str], list[str]]:
    """
    Semantic similarity between student skills and required skills.
    Uses sentence embeddings + cosine similarity.
    Returns score (0-1), matched skills, unmatched required skills.
    """
    if not required_skills:
        return 1.0, [], []
    if not student_skills:
        return 0.0, [], required_skills

    student_embeddings = embed(student_skills)
    required_embeddings = embed(required_skills)

    matched = []
    unmatched = []
    total_score = 0.0

    for i, req_skill in enumerate(required_skills):
        # Find best matching student skill via cosine similarity
        similarities = [cosine_similarity(student_embeddings[j], required_embeddings[i])
                        for j in range(len(student_skills))]
        best_sim = max(similarities)
        best_idx = int(np.argmax(similarities))

        if best_sim >= 0.75:  # threshold for "matched"
            matched.append(req_skill)
            total_score += best_sim
        else:
            unmatched.append(req_skill)
            total_score += best_sim * 0.3  # partial credit

    return min(total_score / len(required_skills), 1.0), matched, unmatched


def _text_similarity(a: str, b: str) -> float:
    """Semantic similarity between two short strings. Returns 0-1."""
    if not a or not b:
        return 0.0
    if normalize_skill(a) == normalize_skill(b):
        return 1.0
    vecs = embed([a, b])
    return cosine_similarity(vecs[0], vecs[1])


def _cgpa_score(student_cgpa: float | None, min_cgpa: float) -> float:
    """Returns 1.0 if eligible, scaled down if below minimum."""
    if student_cgpa is None:
        return 0.5  # unknown — give benefit of doubt
    if min_cgpa == 0.0:
        return 1.0
    if student_cgpa >= min_cgpa:
        return 1.0
    return max(0.0, student_cgpa / min_cgpa)


def calculate_match(
    student_skills: list[str],
    student_degree: str,
    student_branch: str,
    student_cgpa: float | None,
    student_location: str,
    student_sector: str,
    required_skills: list[str],
    preferred_degree: str,
    preferred_branches: list[str],
    min_cgpa: float,
    internship_location: str,
    internship_sector: str,
) -> MatchResult:
    """
    Calculate weighted match score between a student and an internship.
    """
    reasons = []

    # 1. Skills (50%)
    skills_raw, matched_skills, unmatched_skills = _semantic_skill_score(student_skills, required_skills)
    skills_score = round(skills_raw * 100, 2)
    for s in matched_skills:
        reasons.append(f"✓ {s} matched")
    for s in unmatched_skills:
        reasons.append(f"✗ {s} not found")

    # 2. Degree (15%)
    degree_raw = _text_similarity(student_degree, preferred_degree) if preferred_degree else 1.0
    degree_score = round(degree_raw * 100, 2)
    if degree_raw >= 0.8:
        reasons.append("✓ Degree eligible")
    else:
        reasons.append("✗ Degree mismatch")

    # 3. Branch (10%)
    branch_raw = 0.0
    if preferred_branches:
        branch_sims = [_text_similarity(student_branch, b) for b in preferred_branches]
        branch_raw = max(branch_sims)
    else:
        branch_raw = 1.0
    branch_score = round(branch_raw * 100, 2)
    if branch_raw >= 0.8:
        reasons.append("✓ Branch eligible")
    else:
        reasons.append("✗ Branch mismatch")

    # 4. CGPA (10%)
    cgpa_raw = _cgpa_score(student_cgpa, min_cgpa)
    cgpa_score = round(cgpa_raw * 100, 2)
    if cgpa_raw >= 1.0:
        reasons.append(f"✓ CGPA {student_cgpa} meets minimum {min_cgpa}")
    else:
        reasons.append(f"✗ CGPA {student_cgpa} below minimum {min_cgpa}")

    # 5. Location (10%)
    location_raw = _text_similarity(student_location, internship_location) if internship_location else 1.0
    location_score = round(location_raw * 100, 2)
    if location_raw >= 0.7:
        reasons.append("✓ Location preference matched")

    # 6. Sector (5%)
    sector_raw = _text_similarity(student_sector, internship_sector) if internship_sector else 1.0
    sector_score = round(sector_raw * 100, 2)
    if sector_raw >= 0.7:
        reasons.append("✓ Sector interest matched")

    # Weighted overall score
    overall = (
        skills_raw * WEIGHTS["skills"]
        + degree_raw * WEIGHTS["degree"]
        + branch_raw * WEIGHTS["branch"]
        + cgpa_raw * WEIGHTS["cgpa"]
        + location_raw * WEIGHTS["location"]
        + sector_raw * WEIGHTS["sector"]
    ) * 100

    logger.debug(f"Match score: {overall:.2f}% | Skills: {skills_score}% | Degree: {degree_score}%")

    return MatchResult(
        overall_score=round(overall, 2),
        skills_score=skills_score,
        degree_score=degree_score,
        branch_score=branch_score,
        cgpa_score=cgpa_score,
        location_score=location_score,
        sector_score=sector_score,
        matched_skills=matched_skills,
        unmatched_skills=unmatched_skills,
        reasons=reasons,
    )
