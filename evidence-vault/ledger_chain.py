"""
Hash-chained Postgres ledger — Hyperledger Fabric stand-in.

Each row stores: entry_hash = SHA256(payload_hash + previous_entry_hash)
Gives tamper-evidence: modifying any row breaks all subsequent hashes.

Interface designed for Fabric swap-in without touching calling code.
"""
import hashlib
from typing import Optional, List
from dataclasses import dataclass
from datetime import datetime


GENESIS_HASH = "0" * 64


@dataclass
class LedgerEntry:
    """A single entry in the hash-chained evidence ledger."""
    id: int
    created_at: datetime
    case_id: str
    payload_hash: str
    previous_hash: str
    entry_hash: str
    payload_type: str
    payload_ref: Optional[str] = None


def compute_entry_hash(payload_hash: str, previous_hash: str) -> str:
    """Compute: SHA256(payload_hash + previous_hash)."""
    combined = (payload_hash + previous_hash).encode("utf-8")
    return hashlib.sha256(combined).hexdigest()


def append(
    case_id: str,
    payload_hash: str,
    payload_type: str,
    payload_ref: Optional[str] = None,
    previous_hash: Optional[str] = None,
) -> LedgerEntry:
    """
    Append a new entry to the hash-chained ledger.

    Returns LedgerEntry with computed entry_hash.
    DB persistence happens in the backend service layer.
    """
    prev = previous_hash or GENESIS_HASH
    entry_hash = compute_entry_hash(payload_hash, prev)

    return LedgerEntry(
        id=0,
        created_at=datetime.utcnow(),
        case_id=case_id,
        payload_hash=payload_hash,
        previous_hash=prev,
        entry_hash=entry_hash,
        payload_type=payload_type,
        payload_ref=payload_ref,
    )


def verify_chain(entries: List[LedgerEntry]) -> bool:
    """
    Verify the integrity of a hash chain.

    Returns True if the chain is intact (no entries tampered with).
    """
    if not entries:
        return True

    for i, entry in enumerate(entries):
        # Verify this entry's hash is correct
        expected = compute_entry_hash(entry.payload_hash, entry.previous_hash)
        if entry.entry_hash != expected:
            return False

        # Verify chain linkage (each entry's previous_hash == prior entry's entry_hash)
        if i > 0 and entry.previous_hash != entries[i - 1].entry_hash:
            return False

        # First entry should link to genesis
        if i == 0 and entry.previous_hash != GENESIS_HASH:
            # Allow non-genesis first entries for sub-chains
            pass

    return True


def find_break_point(entries: List[LedgerEntry]) -> Optional[int]:
    """
    Find the index of the first broken link in the chain.

    Returns None if chain is intact, otherwise the index of the bad entry.
    """
    for i, entry in enumerate(entries):
        expected = compute_entry_hash(entry.payload_hash, entry.previous_hash)
        if entry.entry_hash != expected:
            return i
        if i > 0 and entry.previous_hash != entries[i - 1].entry_hash:
            return i
    return None
