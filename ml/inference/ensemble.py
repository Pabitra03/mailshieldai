"""
Ensemble score fusion — non-linear multi-vector risk engine for MailShieldAI.

Calibrated for real-world cybersecurity threat characteristics:
- Dominant attack vector rule: Any high-confidence signal (intent, URL, header spoofing)
  cannot be diluted to "Low Risk" by inactive modalities (e.g. brand checks without images).
- Compounding risk: Multiple co-occurring indicators trigger exponential escalation.
- Novelty escalation: Zero-day / anomalous patterns detected by Isolation Forest
  receive immediate anomaly boost.
- Calibrated verdicts:
    risk >= 68 → High Risk (Phishing / BEC / Look-alike / Novel Payload)
    risk >= 38 → Suspicious / Caution
    risk >= 20 → Low Risk
    risk < 20  → Legitimate / Clean
"""
from typing import Optional


# Baseline component weights
BASE_WEIGHTS = {
    "header": 0.30,
    "intent": 0.35,
    "url": 0.25,
    "brand": 0.10,
}


def fuse_scores(
    header_prob: float = 0.0,
    intent_prob: float = 0.0,
    url_prob: float = 0.0,
    brand_prob: float = 0.0,
    is_novel: bool = False,
) -> dict:
    """
    Fuse component scores into a final risk score and actionable verdict.

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
    hp = max(0.0, min(1.0, float(header_prob)))
    ip = max(0.0, min(1.0, float(intent_prob)))
    up = max(0.0, min(1.0, float(url_prob)))
    bp = max(0.0, min(1.0, float(brand_prob)))

    # Determine dominant threat vector
    max_vector = max(hp, ip, up, bp)

    # Active weight normalization (ignore brand when no logo was provided/0.0)
    weights = dict(BASE_WEIGHTS)
    if bp == 0.0:
        total_active_w = weights["header"] + weights["intent"] + weights["url"]
        norm_w = {
            "header": weights["header"] / total_active_w,
            "intent": weights["intent"] / total_active_w,
            "url": weights["url"] / total_active_w,
            "brand": 0.0,
        }
    else:
        norm_w = weights

    # Normalized weighted average
    weighted_avg = (
        norm_w["header"] * hp +
        norm_w["intent"] * ip +
        norm_w["url"] * up +
        norm_w["brand"] * bp
    )

    # In cybersecurity, a single critical vulnerability is fatal.
    # We blend the dominant vector (65%) with the weighted average (35%)
    # so high-confidence detections are never watered down.
    base_risk = (0.65 * max_vector + 0.35 * weighted_avg) * 100.0

    # Multi-signal reinforcement: if 2+ vectors indicate danger, amplify
    active_threats = sum(1 for p in (hp, ip, up, bp) if p >= 0.50)
    coincidence_boost = 1.0
    if active_threats >= 3:
        coincidence_boost = 1.25
    elif active_threats == 2:
        coincidence_boost = 1.15

    risk = base_risk * coincidence_boost

    # Isolation Forest Novelty boost
    if is_novel:
        risk = max(risk, 55.0) + 12.0

    # Strong single vector guarantees minimum risk floors
    if max_vector >= 0.85:
        risk = max(risk, 78.0)
    elif max_vector >= 0.70:
        risk = max(risk, 66.0)
    elif max_vector >= 0.50:
        risk = max(risk, 48.0)

    # Clamp to [0, 99.9]
    final_risk = round(max(4.0, min(99.4, risk)), 1)

    # Determine verdict based on risk score + dominant signals
    verdict = _determine_verdict(
        final_risk,
        header_prob=hp,
        intent_prob=ip,
        url_prob=up,
        brand_prob=bp,
        is_novel=is_novel,
    )

    return {
        "risk_score": final_risk,
        "verdict": verdict,
        "is_novel": is_novel,
        "component_scores": {
            "header_forensics": round(hp * 100, 1),
            "nlp_intent": round(ip * 100, 1),
            "url_analysis": round(up * 100, 1),
            "brand_impersonation": round(bp * 100, 1),
        },
    }


def _determine_verdict(
    risk_score: float,
    header_prob: float,
    intent_prob: float,
    url_prob: float,
    brand_prob: float,
    is_novel: bool = False,
) -> str:
    """Determine precise threat category or clean status."""
    if risk_score >= 65.0:
        # High Risk categories:
        # 1. BEC: high intent urgency/pressure, often low URL/spoofing
        if intent_prob >= 0.65 and url_prob < 0.45:
            return "BEC"

        # 2. Novel / Zero-day anomaly
        if is_novel:
            return "Novel"

        # 3. Brand impersonation / Look-alike
        if brand_prob >= 0.50:
            return "Look-alike"

        # 4. Phishing (credential harvest or malicious link)
        return "Phishing"

    if risk_score >= 38.0:
        if is_novel:
            return "Novel"
        if brand_prob >= 0.35 or url_prob >= 0.45:
            return "Look-alike"
        return "Suspicious"

    if risk_score >= 20.0:
        return "Low Risk"

    return "Legitimate"

