import logging

import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None
MODEL_NAME = "all-MiniLM-L6-v2"  # fast, lightweight, good quality

# Cache embeddings per text so the allocation loop never re-encodes
# the same string (skills/locations/sectors repeat heavily across pairs).
_text_cache: dict[str, np.ndarray] = {}


def get_model() -> SentenceTransformer:
    """Lazy-load the embedding model (singleton)."""
    global _model
    if _model is None:
        logger.info(f"Loading Sentence Transformer model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
        logger.info("Model loaded successfully.")
    return _model


def embed(texts: list[str]) -> np.ndarray:
    """Return embeddings for a list of texts."""
    model = get_model()
    return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)


def embed_cached(texts: list[str]) -> np.ndarray:
    """
    Return embeddings for a list of texts, reusing cached vectors for
    strings that were embedded before.
    """
    unique = list(dict.fromkeys(texts))
    missing = [t for t in unique if t not in _text_cache]
    if missing:
        encoded = embed(missing)
        for t, vec in zip(missing, encoded):
            _text_cache[t] = vec

    return np.stack([_text_cache[t] for t in texts])


def clear_cache() -> None:
    """Clear the embedding cache (useful for tests)."""
    _text_cache.clear()


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two normalized vectors."""
    return float(np.dot(a, b))
