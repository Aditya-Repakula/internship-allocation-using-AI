import json
import logging

logger = logging.getLogger(__name__)


def to_json(data: list | dict) -> str:
    return json.dumps(data)


def from_json(data: str | None) -> list | dict:
    if not data:
        return []
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON: {data[:100]}")
        return []


def calculate_profile_completion(student) -> float:
    """
    Calculate profile completion percentage based on filled fields.
    Returns a float 0-100.
    """
    fields = [
        student.name,
        student.email,
        student.phone,
        student.college,
        student.degree,
        student.branch,
        student.cgpa,
        student.preferred_location,
        student.interested_sector,
        student.resume_path,
        student.confirmed_skills,
    ]
    filled = sum(1 for f in fields if f is not None and str(f).strip() != "")
    return round((filled / len(fields)) * 100, 1)
