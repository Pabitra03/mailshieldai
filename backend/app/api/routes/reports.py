"""Reports routes — PDF generation for forensic reports and BSA certificates."""
import os
import sys
import uuid
from io import BytesIO
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()

from app.models import CASES_DB, REPORTS_DB

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "evidence-vault"))


def _record_report(case_id: str, report_type: str, filename: str):
    case = CASES_DB.get(case_id, {})
    entry = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        "report_type": report_type,
        "filename": filename,
        "generated_at": datetime.utcnow().isoformat(),
        "subject": case.get("subject", ""),
        "sender": case.get("sender", ""),
        "verdict": case.get("verdict"),
        "risk_score": case.get("risk_score"),
        "download_url": f"/api/cases/{case_id}/{'certificate.pdf' if report_type == 'certificate' else 'report.pdf'}",
    }
    REPORTS_DB.insert(0, entry)
    del REPORTS_DB[25:]
    return entry


@router.get("/reports")
async def list_reports():
    """List recently generated report metadata."""
    return {"reports": REPORTS_DB, "total": len(REPORTS_DB)}


@router.get("/cases/{case_id}/report.pdf")
async def download_report(case_id: str):
    """Generate and download a full forensic report PDF."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    try:
        from bsa_certificate import generate_forensic_report

        pdf_bytes = generate_forensic_report(
            case_id=case_id,
            case_data=case,
            geo_data={"hops": case.get("geo_hops", [])},
            verdict_data={
                "risk_score": case.get("risk_score"),
                "verdict": case.get("verdict"),
                "shap_explanation": case.get("shap_explanation"),
            },
            evidence_data={
                "merkle_root": case.get("merkle_root"),
                "chain_verified": case.get("chain_verified"),
                "ledger_entries": len(case.get("ledger_entries", [])),
            },
        )

        filename = f"report_{case_id[:8]}.pdf"
        _record_report(case_id, "forensic_report", filename)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/cases/{case_id}/certificate.pdf")
async def download_certificate(case_id: str):
    """Generate and download a BSA §63(4) certificate PDF."""
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    try:
        from bsa_certificate import generate_bsa_certificate

        artifacts = case.get("evidence_artifacts", [])
        verdict = case.get("verdict", "Unknown")
        risk = case.get("risk_score", 0)

        pdf_bytes = generate_bsa_certificate(
            case_id=case_id,
            artifacts=artifacts,
            verdict_summary=f"AI Verdict: {verdict} (Risk Score: {risk}/100). "
                            f"Analysis performed by MailShieldAI ensemble model.",
        )

        filename = f"bsa_certificate_{case_id[:8]}.pdf"
        _record_report(case_id, "certificate", filename)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Certificate generation failed: {str(e)}")
