"""
test_ai_unit.py
---------------
Pure unit tests for the AI pipeline.
No database or HTTP client needed — tests logic directly.
"""
import pytest


# ── Resume Parser ─────────────────────────────────────────────────────────────

class TestResumeParser:

    def test_skill_extractor_python(self):
        from app.ai.skill_extractor import extract_skills_from_text
        skills = extract_skills_from_text(
            "Experienced in Python, Machine Learning, TensorFlow, and SQL."
        )
        lower = [s.lower() for s in skills]
        assert "python" in lower

    def test_skill_extractor_multiple_skills(self):
        from app.ai.skill_extractor import extract_skills_from_text
        skills = extract_skills_from_text(
            "Proficient in Python, JavaScript, React, Node.js, and PostgreSQL."
        )
        assert len(skills) >= 2

    def test_skill_extractor_empty_text(self):
        from app.ai.skill_extractor import extract_skills_from_text
        skills = extract_skills_from_text("")
        assert isinstance(skills, list)

    def test_preprocessing_extract_email(self):
        from app.ai.preprocessing import extract_email
        text = "Contact me at john.doe@example.com for more info."
        assert extract_email(text) == "john.doe@example.com"

    def test_preprocessing_extract_phone(self):
        from app.ai.preprocessing import extract_phone
        text = "Call me at 9876543210 anytime."
        phone = extract_phone(text)
        assert phone is not None
        assert "9876543210" in phone

    def test_preprocessing_extract_cgpa(self):
        from app.ai.preprocessing import extract_cgpa
        text = "CGPA: 8.7 / 10"
        cgpa = extract_cgpa(text)
        assert cgpa is not None
        assert 8.5 <= cgpa <= 9.0

    def test_preprocessing_no_cgpa(self):
        from app.ai.preprocessing import extract_cgpa
        text = "No GPA mentioned here."
        assert extract_cgpa(text) is None


# ── AI Matcher ────────────────────────────────────────────────────────────────

class TestMatcher:

    def test_perfect_match(self):
        """Student exactly matching internship → score close to 100."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=["Python", "Machine Learning", "TensorFlow"],
            student_degree="B.Tech",
            student_branch="AIML",
            student_cgpa=9.0,
            student_location="Bangalore",
            student_sector="AI/ML",
            required_skills=["Python", "Machine Learning", "TensorFlow"],
            preferred_degree="B.Tech",
            preferred_branches=["AIML"],
            min_cgpa=6.0,
            internship_location="Bangalore",
            internship_sector="AI/ML",
        )
        assert result.overall_score >= 80.0
        assert 0 <= result.overall_score <= 100

    def test_no_skills_match(self):
        """Student with no skills should score very low."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=[],
            student_degree="B.Tech",
            student_branch="AIML",
            student_cgpa=9.0,
            student_location="Bangalore",
            student_sector="AI/ML",
            required_skills=["Python", "Machine Learning", "TensorFlow"],
            preferred_degree="B.Tech",
            preferred_branches=["AIML"],
            min_cgpa=6.0,
            internship_location="Bangalore",
            internship_sector="AI/ML",
        )
        # Skills are 50% weight; no skills → max possible ~50%
        assert result.overall_score < 60.0
        assert result.skills_score == 0.0

    def test_cgpa_below_minimum(self):
        """Student with CGPA below minimum gets penalised."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=["Python", "Machine Learning"],
            student_degree="B.Tech",
            student_branch="AIML",
            student_cgpa=5.0,          # below min_cgpa of 7.0
            student_location="Bangalore",
            student_sector="AI/ML",
            required_skills=["Python", "Machine Learning"],
            preferred_degree="B.Tech",
            preferred_branches=["AIML"],
            min_cgpa=7.0,
            internship_location="Bangalore",
            internship_sector="AI/ML",
        )
        assert result.cgpa_score < 100.0

    def test_cgpa_meets_minimum(self):
        """Student with CGPA meeting minimum gets full CGPA score."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=["Python"],
            student_degree="B.Tech",
            student_branch="CSE",
            student_cgpa=8.0,
            student_location="",
            student_sector="",
            required_skills=["Python"],
            preferred_degree="",
            preferred_branches=[],
            min_cgpa=7.0,
            internship_location="",
            internship_sector="",
        )
        assert result.cgpa_score == 100.0

    def test_unknown_cgpa_gets_benefit_of_doubt(self):
        """Student with None CGPA gets 50% benefit of doubt."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=["Python"],
            student_degree="B.Tech",
            student_branch="CSE",
            student_cgpa=None,
            student_location="",
            student_sector="",
            required_skills=["Python"],
            preferred_degree="",
            preferred_branches=[],
            min_cgpa=7.0,
            internship_location="",
            internship_sector="",
        )
        assert result.cgpa_score == 50.0

    def test_score_bounds(self):
        """Overall score must always be in [0, 100]."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=["Cooking", "Gardening"],
            student_degree="MBA",
            student_branch="Finance",
            student_cgpa=4.0,
            student_location="Delhi",
            student_sector="Finance",
            required_skills=["Python", "Machine Learning", "Deep Learning"],
            preferred_degree="B.Tech",
            preferred_branches=["CSE", "AIML"],
            min_cgpa=8.0,
            internship_location="Bangalore",
            internship_sector="AI/ML",
        )
        assert 0 <= result.overall_score <= 100

    def test_match_result_has_reasons(self):
        """Match result should always have a non-empty reasons list."""
        from app.ai.matcher import calculate_match
        result = calculate_match(
            student_skills=["Python"],
            student_degree="B.Tech",
            student_branch="CSE",
            student_cgpa=8.0,
            student_location="Bangalore",
            student_sector="IT",
            required_skills=["Python", "ML"],
            preferred_degree="B.Tech",
            preferred_branches=["CSE"],
            min_cgpa=6.0,
            internship_location="Bangalore",
            internship_sector="IT",
        )
        assert isinstance(result.reasons, list)
        assert len(result.reasons) > 0


# ── Allocation Engine ─────────────────────────────────────────────────────────

class TestAllocationEngine:

    def test_gale_shapley_basic(self):
        """2 students, 2 internships, 1 seat each → both get allocated."""
        from app.ai.allocation_engine import (
            InternshipProfile, StudentProfile, run_allocation
        )
        students = [
            StudentProfile(id=1, skills=["Python", "ML"], degree="B.Tech",
                           branch="AIML", cgpa=8.5, preferred_location="Bangalore",
                           interested_sector="AI/ML"),
            StudentProfile(id=2, skills=["Java", "Spring"], degree="B.Tech",
                           branch="CSE", cgpa=7.5, preferred_location="Hyderabad",
                           interested_sector="Backend"),
        ]
        internships = [
            InternshipProfile(id=10, required_skills=["Python", "ML"],
                              preferred_degree="B.Tech", preferred_branches=["AIML"],
                              min_cgpa=6.0, location="Bangalore", sector="AI/ML", seats=1),
            InternshipProfile(id=20, required_skills=["Java", "Spring"],
                              preferred_degree="B.Tech", preferred_branches=["CSE"],
                              min_cgpa=6.0, location="Hyderabad", sector="Backend", seats=1),
        ]
        records = run_allocation(students, internships)
        assert len(records) == 2
        student_ids = {r.student_id for r in records}
        assert 1 in student_ids
        assert 2 in student_ids

    def test_seat_overflow(self):
        """3 students competing for 1 seat → only 1 gets allocated."""
        from app.ai.allocation_engine import (
            InternshipProfile, StudentProfile, run_allocation
        )
        students = [
            StudentProfile(id=i, skills=["Python", "ML"], degree="B.Tech",
                           branch="AIML", cgpa=float(7 + i), preferred_location="Bangalore",
                           interested_sector="AI/ML")
            for i in range(1, 4)
        ]
        internships = [
            InternshipProfile(id=10, required_skills=["Python", "ML"],
                              preferred_degree="B.Tech", preferred_branches=["AIML"],
                              min_cgpa=6.0, location="Bangalore", sector="AI/ML", seats=1),
        ]
        records = run_allocation(students, internships)
        assert len(records) == 1
        # The allocated student should have rank=1
        assert records[0].rank == 1

    def test_all_seats_filled(self):
        """2 students, 1 internship with 2 seats → both get allocated."""
        from app.ai.allocation_engine import (
            InternshipProfile, StudentProfile, run_allocation
        )
        students = [
            StudentProfile(id=1, skills=["Python"], degree="B.Tech",
                           branch="CSE", cgpa=8.0, preferred_location="",
                           interested_sector=""),
            StudentProfile(id=2, skills=["Python"], degree="B.Tech",
                           branch="CSE", cgpa=7.5, preferred_location="",
                           interested_sector=""),
        ]
        internships = [
            InternshipProfile(id=10, required_skills=["Python"],
                              preferred_degree="B.Tech", preferred_branches=["CSE"],
                              min_cgpa=6.0, location="", sector="", seats=2),
        ]
        records = run_allocation(students, internships)
        assert len(records) == 2

    def test_no_students(self):
        """No students → no allocations."""
        from app.ai.allocation_engine import (
            InternshipProfile, run_allocation
        )
        internships = [
            InternshipProfile(id=10, required_skills=["Python"],
                              preferred_degree="B.Tech", preferred_branches=[],
                              min_cgpa=6.0, location="", sector="", seats=2),
        ]
        records = run_allocation([], internships)
        assert records == []

    def test_allocation_scores_are_valid(self):
        """All match scores in allocation records must be in [0, 100]."""
        from app.ai.allocation_engine import (
            InternshipProfile, StudentProfile, run_allocation
        )
        students = [
            StudentProfile(id=1, skills=["Python", "ML"], degree="B.Tech",
                           branch="AIML", cgpa=8.5, preferred_location="Bangalore",
                           interested_sector="AI/ML"),
        ]
        internships = [
            InternshipProfile(id=10, required_skills=["Python", "ML"],
                              preferred_degree="B.Tech", preferred_branches=["AIML"],
                              min_cgpa=6.0, location="Bangalore", sector="AI/ML", seats=1),
        ]
        records = run_allocation(students, internships)
        for rec in records:
            assert 0 <= rec.match_score <= 100
            assert 0 <= rec.skills_score <= 100
            assert 0 <= rec.cgpa_score <= 100
