import logging
import re
from dataclasses import dataclass, field

import numpy as np

from app.ai.embeddings import cosine_similarity, embed_cached
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


# ── Lexical knowledge: aliases, degree families, branch expansions ───────────

def _compact(text: str) -> str:
    """Lowercase with punctuation/whitespace removed, keeping + and #."""
    return re.sub(r"[^a-z0-9+#]", "", text.lower())


SKILL_ALIASES: dict[str, str] = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "c++": "c++",
    "c#": "csharp",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "ds": "data science",
    "sklearn": "scikit learn",
    "scikitlearn": "scikit learn",
    "tf": "tensorflow",
    "keras": "keras",
    "pytorch": "pytorch",
    "reactjs": "react",
    "nextjs": "next.js",
    "nodejs": "node.js",
    "expressjs": "express",
    "postgres": "postgresql",
    "psql": "postgresql",
    "mssql": "sql server",
    "sqlserver": "sql server",
    "k8s": "kubernetes",
    "rest": "rest api",
    "restful": "rest api",
    "restapi": "rest api",
    "pyspark": "apache spark",
    "spark": "apache spark",
    "powerbi": "power bi",
}


def _expand_skill(skill: str) -> str:
    """Map short forms to canonical skill names for comparison."""
    key = _compact(skill)
    return SKILL_ALIASES.get(key, skill.strip())


DEGREE_FAMILIES: dict[str, str] = {
    "btech": "engineering_ug",
    "be": "engineering_ug",
    "mtech": "engineering_pg",
    "me": "engineering_pg",
    "bsc": "science_ug",
    "msc": "science_pg",
    "bca": "computing_ug",
    "mca": "computing_pg",
    "bba": "management_ug",
    "mba": "management_pg",
    "bcom": "commerce_ug",
    "mcom": "commerce_pg",
    "ba": "arts_ug",
    "ma": "arts_pg",
    "barch": "architecture_ug",
    "bpharm": "pharmacy_ug",
    "mpharm": "pharmacy_pg",
    "phd": "doctorate",
}


def _degree_family(degree: str) -> str | None:
    """Canonical family for a degree string (B.Tech / B.E. → same family)."""
    key = _compact(degree)
    if key in DEGREE_FAMILIES:
        return DEGREE_FAMILIES[key]
    # Fallback: "bachelor of technology" style full names
    if "bachelor" in degree.lower() and ("technolog" in degree.lower() or "engineer" in degree.lower()):
        return "engineering_ug"
    if "master" in degree.lower() and ("technolog" in degree.lower() or "engineer" in degree.lower()):
        return "engineering_pg"
    return None


BRANCH_EXPANSIONS: dict[str, str] = {
    "cse": "computer science",
    "cs": "computer science",
    "csc": "computer science",
    "it": "information technology",
    "ise": "information science and engineering",
    "ece": "electronics and communication engineering",
    "ec": "electronics and communication engineering",
    "eee": "electrical and electronics engineering",
    "ee": "electrical engineering",
    "me": "mechanical engineering",
    "mech": "mechanical engineering",
    "ce": "civil engineering",
    "chem": "chemical engineering",
    "bme": "biomedical engineering",
    "aiml": "artificial intelligence and machine learning",
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "ds": "data science",
    "da": "data analytics",
    "csbs": "computer science and business systems",
    "bt": "biotechnology",
    "biotech": "biotechnology",
    "ae": "aeronautical engineering",
    "aero": "aeronautical engineering",
}


def expand_branch(branch: str) -> str:
    """Expand branch abbreviations to full names (CSE → computer science)."""
    key = _compact(branch)
    return BRANCH_EXPANSIONS.get(key, branch.strip())


CITY_ALIASES: dict[str, str] = {
    "bangalore": "bengaluru",
    "bengaluru": "bengaluru",
    "bombay": "mumbai",
    "mumbai": "mumbai",
    "madras": "chennai",
    "chennai": "chennai",
    "calcutta": "kolkata",
    "kolkata": "kolkata",
    "newdelhi": "delhi ncr",
    "delhi": "delhi ncr",
    "ncr": "delhi ncr",
    "gurgaon": "delhi ncr",
    "gurugram": "delhi ncr",
    "noida": "delhi ncr",
    "hyderabad": "hyderabad",
    "pune": "pune",
    "ahmedabad": "ahmedabad",
    "jaipur": "jaipur",
    "kochi": "kochi",
    "kochin": "kochi",
    "thiruvananthapuram": "thiruvananthapuram",
    "trivandrum": "thiruvananthapuram",
}


def _canonical_city(text: str) -> str | None:
    return CITY_ALIASES.get(_compact(text))


REMOTE_LOCATIONS = {"remote", "workfromhome", "wfh", "virtual", "online", "anywhere", "anylocation", "home"}


# ── Similarity helpers ────────────────────────────────────────────────────────

def _embed_cosine(a: str, b: str) -> float:
    """Semantic cosine similarity using the cached embedding layer."""
    vecs = embed_cached([a, b])
    return cosine_similarity(vecs[0], vecs[1])


def _text_similarity(a: str, b: str) -> float:
    """Semantic similarity between two short strings. Returns 0-1."""
    if not a or not b:
        return 0.0
    if normalize_skill(a) == normalize_skill(b):
        return 1.0
    return _embed_cosine(a, b)


def _word_contains(full: str, sub: str) -> bool:
    """True if `sub` appears in `full` as a whole word."""
    return bool(re.search(rf"(?<![a-z0-9]){re.escape(sub)}(?![a-z0-9])", full))


def _skill_pair_similarity(a: str, b: str) -> float:
    """
    Hybrid similarity between two skills:
      1. exact / alias match        → 1.0
      2. word containment           → 0.95   (python ⊂ python programming)
      3. token overlap (jaccard)    → scaled (data structures ≈ data algorithms)
      4. embedding similarity       → fallback
    """
    a = _expand_skill(a)
    b = _expand_skill(b)
    if not a or not b:
        return 0.0

    a_low, b_low = a.lower(), b.lower()
    if a_low == b_low:
        return 1.0
    if _word_contains(a_low, b_low) or _word_contains(b_low, a_low):
        return 0.95

    ta, tb = set(a_low.split()), set(b_low.split())
    if ta and tb:
        union = ta | tb
        jaccard = len(ta & tb) / len(union)
        if jaccard >= 0.6:
            return 0.85 + 0.15 * jaccard

    return _embed_cosine(a_low, b_low)


def _skill_credit(sim: float) -> float:
    """
    Graded credit for a required skill:
      sim ≥ 0.78  → full credit (counts as matched)
      0.55 ≤ sim  → partial credit (near match)
      else        → no credit
    """
    if sim >= 0.78:
        return sim
    if sim >= 0.55:
        return sim * 0.55
    return 0.0


def _semantic_skill_score(
    student_skills: list[str],
    required_skills: list[str],
    evidence: list[str] | None = None,
) -> tuple[float, list[str], list[str], list[str]]:
    """
    Hybrid skill matching with evidence.
    Returns (score 0-1, matched, unmatched, evidence_hits).
    """
    if not required_skills:
        return 1.0, [], [], []
    if not student_skills:
        return 0.0, [], required_skills, []

    evidence = evidence or []
    evidence_joined = " ".join(evidence).lower()
    evidence_hits: list[str] = []

    matched: list[str] = []
    unmatched: list[str] = []
    total_score = 0.0

    for req_skill in required_skills:
        req_expanded = _expand_skill(req_skill)
        sims = [
            _skill_pair_similarity(student_skill, req_expanded)
            for student_skill in student_skills
        ]
        best_sim = max(sims) if sims else 0.0

        # A required skill mentioned in the student's projects / certifications
        # counts as strong evidence even if not in the confirmed skill list.
        if _word_contains(evidence_joined, req_expanded.lower()):
            evidence_hits.append(req_skill)
            best_sim = max(best_sim, 0.9)

        credit = _skill_credit(best_sim)
        if credit >= 0.78:
            matched.append(req_skill)
            total_score += credit
        else:
            unmatched.append(req_skill)
            total_score += credit

    return min(total_score / len(required_skills), 1.0), matched, unmatched, evidence_hits


def _degree_similarity(student_degree: str, preferred_degree: str) -> float:
    """Degree match with family equivalence (B.Tech ≡ B.E., BCA ≡ B.Sc CS)."""
    if not student_degree or not preferred_degree:
        return 0.0
    fam_a, fam_b = _degree_family(student_degree), _degree_family(preferred_degree)
    if fam_a and fam_b:
        return 1.0 if fam_a == fam_b else _text_similarity(student_degree, preferred_degree)
    return _text_similarity(student_degree, preferred_degree)


def _branch_similarity(student_branch: str, preferred_branch: str) -> float:
    """Branch match with abbreviation expansion (CSE ≡ Computer Science)."""
    if not student_branch or not preferred_branch:
        return 0.0
    a, b = expand_branch(student_branch), expand_branch(preferred_branch)
    if a.lower() == b.lower():
        return 1.0
    if _word_contains(a.lower(), b.lower()) or _word_contains(b.lower(), a.lower()):
        return 0.95
    return _embed_cosine(a, b)


def _location_similarity(student_location: str, internship_location: str) -> float:
    """
    Location match:
      - remote / anywhere internships accept everyone
      - students with no stated preference are not penalised
      - known city aliases (Bangalore ≡ Bengaluru) match
    """
    if not internship_location:
        return 1.0
    if _compact(internship_location) in REMOTE_LOCATIONS:
        return 1.0
    if not student_location:
        return 1.0

    city_a, city_b = _canonical_city(student_location), _canonical_city(internship_location)
    if city_a and city_b:
        return 1.0 if city_a == city_b else _text_similarity(student_location, internship_location)
    return _text_similarity(student_location, internship_location)


def _sector_similarity(student_sector: str, internship_sector: str) -> float:
    """Sector match; students without a stated interest are neutral."""
    if not internship_sector or not student_sector:
        return 1.0
    return _text_similarity(student_sector, internship_sector)


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
    evidence: list[str] | None = None,
) -> MatchResult:
    """
    Calculate weighted match score between a student and an internship.

    `evidence` (optional) — free-text project / certification descriptions
    from the parsed resume. Required skills found inside evidence get credit
    even if the exact skill is missing from the confirmed skill list.
    """
    reasons = []

    # 1. Skills (50%)
    skills_raw, matched_skills, unmatched_skills, evidence_hits = _semantic_skill_score(
        student_skills, required_skills, evidence
    )
    skills_score = round(skills_raw * 100, 2)
    for s in matched_skills:
        if s in evidence_hits:
            reasons.append(f"✓ {s} matched (evidenced in project/cert)")
        else:
            reasons.append(f"✓ {s} matched")
    for s in unmatched_skills:
        reasons.append(f"✗ {s} not found")

    # 2. Degree (15%)
    degree_raw = _degree_similarity(student_degree, preferred_degree) if preferred_degree else 1.0
    degree_score = round(degree_raw * 100, 2)
    if degree_raw >= 0.8:
        reasons.append("✓ Degree eligible")
    else:
        reasons.append("✗ Degree mismatch")

    # 3. Branch (10%)
    branch_raw = 0.0
    if preferred_branches:
        branch_sims = [_branch_similarity(student_branch, b) for b in preferred_branches]
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
    location_raw = _location_similarity(student_location, internship_location)
    location_score = round(location_raw * 100, 2)
    if location_raw >= 0.7:
        reasons.append("✓ Location preference matched")

    # 6. Sector (5%)
    sector_raw = _sector_similarity(student_sector, internship_sector)
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
