"""Evidence routes — chain of custody, Merkle root, artifacts."""
from fastapi import APIRouter, HTTPException

router = APIRouter()

from app.models import CASES_DB


@router.get("/cases/{case_id}/evidence")
async def get_evidence(case_id: str):
    """Get evidence chain-of-custody for a case."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "case_id": case_id,
        "merkle_root": case.get("merkle_root"),
        "chain_verified": case.get("chain_verified", False),
        "ledger_entries": case.get("ledger_entries", []),
        "artifacts": case.get("evidence_artifacts", []),
    }
