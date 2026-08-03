import logging
import re
from dataclasses import dataclass, field

import fitz  # PyMuPDF

from app.ai.preprocessing import (
    clean_text,
    extract_cgpa,
    extract_email,
    extract_phone,
)
from app.ai.skill_extractor import extract_section, extract_skills_from_text

logger = logging.getLogger(__name__)


@dataclass
class ParsedResume:
    name: str = ""
    email: str = ""
    phone: str = ""
    college: str = ""
    degree: str = ""
    branch: str = ""
    cgpa: float | None = None
    skills: list[str] = field(default_factory=list)
    projects: list[str] = field(default_factory=list)
    certifications: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)
    languages: list[str] = field(default_factory=list)
    experience: list[str] = field(default_factory=list)
    raw_text: str = ""


def _extract_text_from_pdf(path: str) -> str:
    """Extract raw text from all pages of a PDF."""
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    return text


def _extract_name(text: str) -> str:
    """Heuristic: first non-empty line is usually the candidate's name."""
    for line in text.splitlines():
        line = line.strip()
        if line and len(line.split()) <= 5 and not re.search(r"[@\d]", line):
            return line
    return ""


def _extract_degree_branch(text: str) -> tuple[str, str]:
    degree_patterns = [
        r"\b(B\.?Tech|B\.?E|B\.?Sc|M\.?Tech|M\.?Sc|MBA|BCA|MCA|Ph\.?D)\b",
    ]
    branch_patterns = [
        r"\b(Computer Science|CSE|Information Technology|IT|AIML|Artificial Intelligence|"
        r"Machine Learning|Electronics|ECE|Mechanical|Civil|Data Science)\b",
    ]
    degree = ""
    branch = ""
    for pat in degree_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            degree = m.group(0)
            break
    for pat in branch_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            branch = m.group(0)
            break
    return degree, branch


def _extract_college(text: str) -> str:
    keywords = ["university", "college", "institute", "institution", "iit", "nit", "bits"]
    for line in text.splitlines():
        if any(kw in line.lower() for kw in keywords):
            return line.strip()
    return ""


def _extract_list_section(text: str, headings: list[str]) -> list[str]:
    """Extract bullet-point items under a section heading."""
    all_headings = [
        "skills", "education", "experience", "projects", "certifications",
        "tools", "languages", "achievements", "summary", "objective",
    ]
    section_text = extract_section(text, headings, [h for h in all_headings if h not in headings])
    if not section_text:
        return []
    items = []
    for line in section_text.splitlines():
        line = re.sub(r"^[\-\*\•\>\d\.\)]+\s*", "", line).strip()
        if line and len(line) > 2:
            items.append(line)
    return items


def parse_resume(file_path: str) -> ParsedResume:
    """
    Main entry point. Parses a PDF resume and returns a structured ParsedResume.
    """
    try:
        raw_text = _extract_text_from_pdf(file_path)
    except Exception as e:
        logger.error(f"Failed to read PDF {file_path}: {e}")
        raise ValueError(f"Could not read PDF file: {e}")

    result = ParsedResume(raw_text=raw_text)

    result.name = _extract_name(raw_text)
    result.email = extract_email(raw_text) or ""
    result.phone = extract_phone(raw_text) or ""
    result.college = _extract_college(raw_text)
    result.cgpa = extract_cgpa(raw_text)
    result.degree, result.branch = _extract_degree_branch(raw_text)

    # Skills — from full text
    result.skills = extract_skills_from_text(raw_text)

    # Section-based extractions
    result.projects = _extract_list_section(raw_text, ["projects", "project"])
    result.certifications = _extract_list_section(raw_text, ["certifications", "certification", "courses"])
    result.tools = _extract_list_section(raw_text, ["tools", "technologies", "tech stack"])
    result.languages = _extract_list_section(raw_text, ["languages", "programming languages"])
    result.experience = _extract_list_section(raw_text, ["experience", "work experience", "internship"])

    logger.info(f"Parsed resume for: {result.name} | Skills found: {len(result.skills)}")
    return result
