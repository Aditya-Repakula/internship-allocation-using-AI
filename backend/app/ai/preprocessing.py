import re
import string


def clean_text(text: str) -> str:
    """Remove extra whitespace, special chars, normalize to lowercase."""
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = text.translate(str.maketrans("", "", string.punctuation.replace(".", "").replace("+", "").replace("#", "")))
    return text.strip()


def normalize_skill(skill: str) -> str:
    """Normalize a single skill string."""
    return skill.strip().lower()


def deduplicate(items: list[str]) -> list[str]:
    """Remove duplicates while preserving order."""
    seen = set()
    result = []
    for item in items:
        key = item.lower().strip()
        if key not in seen:
            seen.add(key)
            result.append(item.strip())
    return result


def extract_email(text: str) -> str | None:
    match = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    match = re.search(r"(\+91[\s\-]?)?[6-9]\d{9}", text)
    return match.group(0) if match else None


def extract_cgpa(text: str) -> float | None:
    """Extract CGPA or percentage from text."""
    match = re.search(r"\b([0-9]\.[0-9]{1,2})\s*(cgpa|gpa|/10)?", text, re.IGNORECASE)
    if match:
        val = float(match.group(1))
        if val <= 10.0:
            return val
    return None
