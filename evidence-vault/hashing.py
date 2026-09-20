"""
SHA-256 hashing utilities for evidence integrity.

Produces deterministic hashes for:
- Raw email bytes
- Attachment bytes
- JSON verdict documents
- Image/screenshot data
"""
import hashlib
import json
from typing import Union


def hash_bytes(data: bytes) -> str:
    """Compute SHA-256 hash of raw bytes."""
    return hashlib.sha256(data).hexdigest()


def hash_string(text: str, encoding: str = "utf-8") -> str:
    """Compute SHA-256 hash of a string."""
    return hashlib.sha256(text.encode(encoding)).hexdigest()


def hash_file(filepath: str) -> str:
    """Compute SHA-256 hash of a file, streaming for large files."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def hash_json(obj: Union[dict, list]) -> str:
    """
    Compute SHA-256 hash of a JSON-serializable object.

    Uses sorted keys and consistent formatting for deterministic output.
    """
    canonical = json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def verify_hash(data: bytes, expected_hash: str) -> bool:
    """Verify that data matches an expected SHA-256 hash."""
    actual = hashlib.sha256(data).hexdigest()
    # Use constant-time comparison to prevent timing attacks
    return hashlib.sha256(actual.encode()).digest() == hashlib.sha256(expected_hash.encode()).digest()


def multi_hash(data: bytes) -> dict:
    """Compute multiple hash algorithms for a single piece of data."""
    return {
        "sha256": hashlib.sha256(data).hexdigest(),
        "sha512": hashlib.sha512(data).hexdigest(),
        "md5": hashlib.md5(data).hexdigest(),
    }
