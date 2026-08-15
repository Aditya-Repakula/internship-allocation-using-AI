import difflib
import re

import spacy

from app.ai.preprocessing import deduplicate, normalize_skill

# Curated skill vocabulary — extend as needed
SKILL_VOCAB = {
    # Languages
    "python", "java", "c", "c++", "c#", "javascript", "typescript", "r", "go",
    "kotlin", "swift", "php", "ruby", "scala", "rust", "matlab",
    # Web
    "html", "css", "react", "reactjs", "angular", "vue", "nodejs", "express",
    "django", "flask", "fastapi", "spring", "bootstrap", "tailwind",
    # Data / AI / ML
    "machine learning", "deep learning", "nlp", "computer vision", "data science",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas",
    "numpy", "matplotlib", "seaborn", "opencv", "huggingface", "transformers",
    "bert", "gpt", "llm", "langchain", "spacy", "nltk",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "sqlite", "redis", "firebase",
    "oracle", "cassandra", "elasticsearch",
    # Cloud / DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "git", "github", "gitlab",
    "ci/cd", "linux", "bash", "terraform", "jenkins",
    # Tools
    "excel", "power bi", "tableau", "jupyter", "vs code", "postman", "figma",
    "jira", "notion", "hadoop", "spark", "kafka",
    # Misc
    "data engineering", "computer vision", "software development", "unix", "linux",
}

SKILL_ALIASES = {
    "node.js": "nodejs",
    "react.js": "react",
    "vue.js": "vue",
    "postgre sql": "postgresql",
    "postgre": "postgresql",
    "mongodb": "mongodb",
    "aws s3": "aws",
    "azure devops": "azure",
    "c sharp": "c#",
    "c plus plus": "c++",
    "scikit learn": "scikit-learn",
    "machinelearning": "machine learning",
    "deeplearning": "deep learning",
    "computer vision": "computer vision",
}

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_md")
        except OSError:
            try:
                _nlp = spacy.load("en_core_web_sm")
            except OSError as exc:
                raise RuntimeError(
                    "spaCy model not found. Install one of: en_core_web_md or en_core_web_sm"
                ) from exc
    return _nlp


def _normalize_candidate(token: str) -> str:
    normalized = re.sub(r"[^a-z0-9#+]+", " ", token.lower()).strip()
    normalized = SKILL_ALIASES.get(normalized, normalized)
    return normalized


def extract_skills_from_text(text: str) -> list[str]:
    """
    Extract skills using three strategies:
    1. Vocabulary matching (fast, high precision)
    2. alias normalization and fuzzy matching
    3. spaCy noun chunks for missed technical terms
    """
    text_lower = text.lower()
    found = []
    normalized_found = set()

    # Strategy 1: vocabulary match
    for skill in SKILL_VOCAB:
        normalized_skill = _normalize_candidate(skill)
        pattern = r"\b" + re.escape(normalized_skill) + r"\b"
        if re.search(pattern, text_lower):
            display_skill = skill.title() if len(skill) <= 3 else skill.capitalize()
            found.append(display_skill)
            normalized_found.add(normalized_skill)

    # Strategy 2: fuzzy matching for variants and aliases
    for variant, canonical in SKILL_ALIASES.items():
        if variant in text_lower and canonical not in normalized_found:
            display_skill = canonical.title() if len(canonical) <= 3 else canonical.capitalize()
            found.append(display_skill)
            normalized_found.add(canonical)

    # Strategy 3: spaCy noun chunks that look like tech terms
    try:
        nlp = _get_nlp()
        doc = nlp(text[:5000])  # limit for performance
        for chunk in doc.noun_chunks:
            token = _normalize_candidate(chunk.text)
            if token in SKILL_VOCAB and token not in normalized_found:
                found.append(chunk.text.strip())
                normalized_found.add(token)
    except RuntimeError:
        pass

    return deduplicate(found)


def extract_section(text: str, section_names: list[str], next_sections: list[str]) -> str:
    """Extract a section block from resume text by heading name."""
    pattern = r"(?i)(?:" + "|".join(re.escape(s) for s in section_names) + r")\s*[:\-]?\s*\n(.*?)(?=\n(?:" + "|".join(re.escape(s) for s in next_sections) + r")\s*[:\-]?\s*\n|$)"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""
