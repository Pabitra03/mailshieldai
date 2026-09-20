"""Cases routes — list all cases, get case detail."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

from app.models import CASES_DB


class StatusUpdate(BaseModel):
    status: str


@router.get("/cases")
async def list_cases(limit: int = 50, offset: int = 0):
    """List all cases, most recent first."""
    all_cases = sorted(
        CASES_DB.values(),
        key=lambda c: c.get("created_at", ""),
        reverse=True,
    )
    page = all_cases[offset:offset + limit]

    # Return summary fields only
    summaries = []
    for c in page:
        summaries.append({
            "id": c["id"],
            "created_at": c.get("created_at"),
            "sender": c.get("sender", ""),
            "subject": c.get("subject", ""),
            "risk_score": c.get("risk_score"),
            "verdict": c.get("verdict"),
            "status": c.get("status"),
            "origin_country": c.get("origin_country"),
            "is_novel": c.get("is_novel", False),
            "detection_time_ms": c.get("detection_time_ms"),
        })

    return {"cases": summaries, "total": len(all_cases)}


@router.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get full case detail."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/cases/{case_id}/review")
async def mark_reviewed(case_id: str):
    """Mark a case as analyst reviewed."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case["status"] = "In Review"
    case["reviewed"] = True
    return {"case_id": case_id, "status": case["status"], "reviewed": True}


@router.post("/cases/{case_id}/escalate")
async def escalate_case(case_id: str):
    """Escalate a case for formal action."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case["status"] = "Escalated"
    case["escalated"] = True
    return {"case_id": case_id, "status": case["status"], "escalated": True}


@router.patch("/cases/{case_id}/status")
async def update_status(case_id: str, payload: StatusUpdate):
    """Update case status for demo analyst actions."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case["status"] = payload.status
    return {"case_id": case_id, "status": case["status"]}
