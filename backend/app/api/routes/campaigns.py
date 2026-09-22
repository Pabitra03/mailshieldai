"""Campaigns routes — threat actor clustering."""
from fastapi import APIRouter
from datetime import datetime
from itertools import combinations
import re

router = APIRouter()

from app.models import CASES_DB

# Threat verdicts that indicate malicious/phishing activity
# ML service returns: "Legitimate", "Low Risk", "Look-alike", "BEC", "Phishing"
# Local engine may also return "Novel" as verdict
THREAT_VERDICTS = ("Phishing", "BEC", "Look-alike", "Low Risk", "Novel")


def _calculate_threat_level(email_count: int, verdicts: dict) -> str:
    """Calculate threat level based on email count and verdict severity."""
    phishing_count = verdicts.get("Phishing", 0)
    bec_count = verdicts.get("BEC", 0)
    lookalike_count = verdicts.get("Look-alike", 0)
    low_risk_count = verdicts.get("Low Risk", 0)
    novel_count = verdicts.get("Novel", 0)
    
    total_threat = phishing_count * 1 + bec_count * 2 + lookalike_count * 1 + low_risk_count * 1 + novel_count * 1
    if bec_count > 0 or total_threat >= 5:
        return "Critical"
    elif total_threat >= 3:
        return "High"
    elif total_threat >= 2:
        return "Medium"
    return "Low"


def _extract_urls(case: dict) -> list[str]:
    text = " ".join([
        str(case.get("body_text", "")),
        str(case.get("body_html", "")),
        " ".join(str(v) for v in case.get("headers_json", {}).values()),
    ])
    return re.findall(r"https?://[^\s<>'\"]+", text)


def _case_signals(case: dict) -> dict:
    urls = _extract_urls(case)
    domains = []
    for url in urls:
        match = re.search(r"https?://([^/\s]+)", url)
        if match:
            domains.append(match.group(1).lower())

    return {
        "asn": case.get("origin_asn") or "",
        "country": case.get("origin_country") or "",
        "sender_domain": (case.get("sender", "").split("@")[-1].strip("> ") if "@" in case.get("sender", "") else ""),
        "url_domains": sorted(set(domains)),
        "urls": sorted(set(urls)),
    }


def _build_case_graph() -> dict:
    threat_cases = [
        case for case in CASES_DB.values()
        if case.get("verdict") in THREAT_VERDICTS
    ]
    signals_by_id = {case["id"]: _case_signals(case) for case in threat_cases}

    nodes = []
    for case in threat_cases:
        signals = signals_by_id[case["id"]]
        nodes.append({
            "id": case["id"],
            "name": case.get("subject") or case["id"][:8],
            "subject": case.get("subject", ""),
            "sender": case.get("sender", ""),
            "verdict": case.get("verdict", "Unknown"),
            "risk_score": case.get("risk_score") or 0,
            "origin_asn": case.get("origin_asn") or "Unknown",
            "origin_country": case.get("origin_country") or "Unknown",
            "created_at": case.get("created_at"),
            "signals": signals,
            "val": max(6, min(24, (case.get("risk_score") or 0) / 4)),
        })

    links = []
    for left, right in combinations(threat_cases, 2):
        left_signals = signals_by_id[left["id"]]
        right_signals = signals_by_id[right["id"]]
        shared = []
        if left_signals["asn"] and left_signals["asn"] == right_signals["asn"]:
            shared.append(f"ASN {left_signals['asn']}")
        if left_signals["sender_domain"] and left_signals["sender_domain"] == right_signals["sender_domain"]:
            shared.append(f"Sender domain {left_signals['sender_domain']}")
        shared_domains = sorted(set(left_signals["url_domains"]) & set(right_signals["url_domains"]))
        shared.extend([f"URL domain {domain}" for domain in shared_domains])
        if left_signals["country"] and left_signals["country"] == right_signals["country"]:
            shared.append(f"Origin country {left_signals['country']}")

        if shared:
            links.append({
                "source": left["id"],
                "target": right["id"],
                "shared": shared,
                "strength": len(shared),
            })

    return {"nodes": nodes, "links": links}


@router.get("/campaigns")
async def list_campaigns():
    """List campaign clusters derived from case data."""
    # Group cases by shared origin ASN + similar subjects
    campaigns = {}
    for case in CASES_DB.values():
        asn = case.get("origin_asn", "unknown")
        verdict = case.get("verdict", "")
        if verdict in THREAT_VERDICTS:
            key = asn or "unknown"
            if key not in campaigns:
                campaigns[key] = {
                    "id": f"campaign-{key}",
                    "name": f"Cluster: {key}",
                    "email_count": 0,
                    "unique_senders": set(),
                    "first_seen": None,
                    "last_seen": None,
                "shared_infra": [key],
                "verdicts": {},
                "cases": [],
                }
            campaigns[key]["email_count"] += 1
            campaigns[key]["verdicts"][verdict] = campaigns[key]["verdicts"].get(verdict, 0) + 1
            campaigns[key]["cases"].append(case["id"])
            campaigns[key]["unique_senders"].add(case.get("sender", ""))
            
            # Track first/last seen
            created = case.get("created_at", "")
            if created:
                try:
                    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    if campaigns[key]["first_seen"] is None or dt < campaigns[key]["first_seen"]:
                        campaigns[key]["first_seen"] = dt
                    if campaigns[key]["last_seen"] is None or dt > campaigns[key]["last_seen"]:
                        campaigns[key]["last_seen"] = dt
                except Exception:
                    pass

    # Convert to list with calculated fields
    result = []
    for key, camp in campaigns.items():
        threat_level = _calculate_threat_level(camp["email_count"], camp["verdicts"])
        result.append({
            "id": f"campaign-{key}",
            "name": f"Cluster: {key}",
            "first_seen": camp["first_seen"].strftime("%Y-%m-%d") if camp["first_seen"] else "Unknown",
            "last_seen": camp["last_seen"].strftime("%Y-%m-%d") if camp["last_seen"] else "Unknown",
            "email_count": camp["email_count"],
            "unique_senders": len(camp["unique_senders"]),
            "shared_infra": camp["shared_infra"],
            "verdict_distribution": camp["verdicts"],
            "verdicts": camp["verdicts"],
            "threat_level": threat_level,
            "cases": camp["cases"],
        })

    return {"campaigns": result, "graph": _build_case_graph(), "total": len(result)}


@router.get("/campaigns/graph")
async def get_campaign_graph():
    """Get case-level campaign graph derived from shared indicators."""
    return _build_case_graph()


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign detail."""
    campaigns = (await list_campaigns())["campaigns"]
    for c in campaigns:
        if c["id"] == campaign_id:
            return c
    return {"error": "Campaign not found"}
