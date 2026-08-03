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
}

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load("en_core_web_md")
        except OSError:
            _nlp = spacy.load("en_core_web_sm")
    return _nlp


def extract_skills_from_text(text: str) -> list[str]:
    """
    Extract skills using two strategies:
    1. Vocabulary matching (fast, high precision)
    2. spaCy NER for any missed technical terms
    """
    text_lower = text.lower()
    found = []

    # Strategy 1: vocabulary match
    for skill in SKILL_VOCAB:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.append(skill.title() if len(skill) <= 3 else skill.capitalize())

    # Strategy 2: spaCy noun chunks that look like tech terms
    nlp = _get_nlp()
    doc = nlp(text[:5000])  # limit for performance
    for chunk in doc.noun_chunks:
        token = chunk.text.strip().lower()
        if token in SKILL_VOCAB and token not in [s.lower() for s in found]:
            found.append(chunk.text.strip())

    return deduplicate(found)


def extract_section(text: str, section_names: list[str], next_sections: list[str]) -> str:
    """Extract a section block from resume text by heading name."""
    pattern = r"(?i)(?:" + "|".join(re.escape(s) for s in section_names) + r")\s*[:\-]?\s*\n(.*?)(?=\n(?:" + "|".join(re.escape(s) for s in next_sections) + r")\s*[:\-]?\s*\n|$)"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""
