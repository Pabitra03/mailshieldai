"""Verdicts routes — list recent verdicts."""
from fastapi import APIRouter

router = APIRouter()

from app.models import CASES_DB


@router.get("/verdicts")
async def list_verdicts(limit: int = 50, offset: int = 0):
    """List recent verdicts."""
    all_cases = sorted(
        CASES_DB.values(),
        key=lambda c: c.get("created_at", ""),
        reverse=True,
    )
    page = all_cases[offset:offset + limit]

    verdicts = []
    for c in page:
        if c.get("verdict"):
            verdicts.append({
                "case_id": c["id"],
                "created_at": c.get("created_at"),
                "sender": c.get("sender"),
                "subject": c.get("subject"),
                "risk_score": c.get("risk_score"),
                "verdict": c.get("verdict"),
                "is_novel": c.get("is_novel", False),
            })

    return {"verdicts": verdicts, "total": len(verdicts)}
