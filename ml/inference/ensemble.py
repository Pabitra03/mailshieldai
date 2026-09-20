"""
Ensemble score fusion — weighted combination of all model outputs.

Weights are calibrated for the MVP dataset balance. The formula:
    risk_score = (w_header * header_prob + w_intent * intent_prob +
                  w_url * url_prob + w_brand * brand_prob) * 100

Verdict mapping:
    risk >= 75 → Phishing / BEC / Malware (depends on top signals)
    risk >= 50 → Look-alike / Suspicious
    risk >= 25 → Low Risk
    risk < 25  → Legitimate
"""
from typing import Optional


# Ensemble weights — sum to 1.0
WEIGHTS = {
    "header": 0.30,
    "intent": 0.35,
    "url": 0.20,
    "brand": 0.15,
}


def fuse_scores(
    header_prob: float = 0.0,
    intent_prob: float = 0.0,
    url_prob: float = 0.0,
    brand_prob: float = 0.0,
    is_novel: bool = False,
) -> dict:
    """
    Fuse component scores into a final verdict.

    Args:
        header_prob: probability from header LightGBM [0, 1]
        intent_prob: probability from NLP intent classifier [0, 1]
        url_prob: max suspicious URL probability [0, 1]
        brand_prob: brand logo match probability [0, 1]
        is_novel: Isolation Forest novelty flag

    Returns:
        dict with risk_score (0-100), verdict, is_novel, component_scores
    """
    # Clamp inputs
    header_prob = max(0.0, min(1.0, header_prob))
    intent_prob = max(0.0, min(1.0, intent_prob))
    url_prob = max(0.0, min(1.0, url_prob))
    brand_prob = max(0.0, min(1.0, brand_prob))

    # Weighted fusion
    fused = (
        WEIGHTS["header"] * header_prob +
        WEIGHTS["intent"] * intent_prob +
        WEIGHTS["url"] * url_prob +
        WEIGHTS["brand"] * brand_prob
    )

    # Scale to 0-100
    risk_score = round(fused * 100, 1)

    # Determine verdict based on risk score + dominant signals
    verdict = _determine_verdict(
        risk_score,
        header_prob=header_prob,
        intent_prob=intent_prob,
        url_prob=url_prob,
        brand_prob=brand_prob,
    )

    return {
        "risk_score": risk_score,
        "verdict": verdict,
        "is_novel": is_novel,
        "component_scores": {
            "header_forensics": round(header_prob * 100, 1),
            "nlp_intent": round(intent_prob * 100, 1),
            "url_analysis": round(url_prob * 100, 1),
            "brand_impersonation": round(brand_prob * 100, 1),
        },
    }


def _determine_verdict(
    risk_score: float,
    header_prob: float,
    intent_prob: float,
    url_prob: float,
    brand_prob: float,
) -> str:
    """Determine verdict string from risk score and dominant signals."""
    if risk_score < 25:
        return "Legitimate"

    if risk_score < 50:
        if url_prob > 0.6 or brand_prob > 0.5:
            return "Look-alike"
        return "Low Risk"

    # High risk — determine the specific threat type
    # BEC: high intent but moderate/low header+URL (socially engineered, not forged)
    if intent_prob > 0.7 and header_prob < 0.5 and url_prob < 0.5:
        return "BEC"

    # Brand impersonation
    if brand_prob > 0.6:
        return "Look-alike"

    # Generic phishing
    return "Phishing"
