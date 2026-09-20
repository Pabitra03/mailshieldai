"""Geo-intelligence routes — hop chain and geo data for a case."""
from fastapi import APIRouter, HTTPException

router = APIRouter()

from app.models import CASES_DB


@router.get("/cases/{case_id}/geo")
async def get_geo_intel(case_id: str):
    """Get geo-forensic hop chain for a case."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "case_id": case_id,
        "hops": case.get("geo_hops", []),
        "overall_confidence": case.get("geo_confidence", "Insufficient"),
        "origin_country": case.get("origin_country"),
        "origin_city": case.get("origin_city"),
        "origin_asn": case.get("origin_asn"),
    }
