"""
Merkle tree construction and verification for evidence sets.

Produces a single root hash that represents the entire evidence collection.
Any change to any artifact invalidates the root.
"""
import hashlib
from typing import List, Optional


def _hash_pair(a: str, b: str) -> str:
    """Hash two hex-string hashes together."""
    combined = (a + b).encode("utf-8")
    return hashlib.sha256(combined).hexdigest()


def build_merkle_tree(leaf_hashes: List[str]) -> dict:
    """
    Build a Merkle tree from leaf hashes.

    Args:
        leaf_hashes: list of SHA-256 hex strings (one per evidence artifact)

    Returns:
        dict with "root", "leaves", "levels", and "proof_data"
    """
    if not leaf_hashes:
        return {
            "root": hashlib.sha256(b"empty").hexdigest(),
            "leaves": [],
            "levels": [],
            "leaf_count": 0,
        }

    if len(leaf_hashes) == 1:
        return {
            "root": leaf_hashes[0],
            "leaves": leaf_hashes,
            "levels": [leaf_hashes],
            "leaf_count": 1,
        }

    levels = [list(leaf_hashes)]

    current_level = list(leaf_hashes)
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            if i + 1 < len(current_level):
                parent = _hash_pair(current_level[i], current_level[i + 1])
            else:
                # Odd leaf: duplicate and hash with itself
                parent = _hash_pair(current_level[i], current_level[i])
            next_level.append(parent)
        levels.append(next_level)
        current_level = next_level

    return {
        "root": current_level[0],
        "leaves": leaf_hashes,
        "levels": levels,
        "leaf_count": len(leaf_hashes),
    }


def verify_merkle_root(leaf_hashes: List[str], expected_root: str) -> bool:
    """Verify that a set of leaf hashes produces the expected Merkle root."""
    tree = build_merkle_tree(leaf_hashes)
    return tree["root"] == expected_root


def get_merkle_proof(tree: dict, leaf_index: int) -> List[dict]:
    """
    Generate a Merkle proof for a specific leaf.

    The proof is a list of sibling hashes needed to recompute the root.
    """
    if leaf_index >= tree["leaf_count"]:
        return []

    proof = []
    idx = leaf_index

    for level in tree["levels"][:-1]:
        if idx % 2 == 0:
            sibling_idx = idx + 1
            direction = "right"
        else:
            sibling_idx = idx - 1
            direction = "left"

        if sibling_idx < len(level):
            proof.append({
                "hash": level[sibling_idx],
                "direction": direction,
            })
        else:
            proof.append({
                "hash": level[idx],
                "direction": "right",
            })

        idx = idx // 2

    return proof


def verify_merkle_proof(
    leaf_hash: str,
    proof: List[dict],
    expected_root: str,
) -> bool:
    """
    Verify a Merkle proof for a specific leaf.

    Given a leaf hash and its proof path, verify it leads to the expected root.
    """
    current = leaf_hash

    for step in proof:
        sibling = step["hash"]
        if step["direction"] == "right":
            current = _hash_pair(current, sibling)
        else:
            current = _hash_pair(sibling, current)

    return current == expected_root
