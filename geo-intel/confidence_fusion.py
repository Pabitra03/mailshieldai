"""
Multi-signal confidence fusion for geo-forensic attribution.

NEVER outputs a bare guess. If signals disagree, says so honestly.
"""
from typing import List, Dict, Optional
from enum import Enum


class Confidence(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INSUFFICIENT = "Insufficient"


def compute_hop_confidence(
    geoip_data: Dict,
    asn_data: Dict,
    rdap_data: Dict,
    is_tor: bool,
    is_vpn: bool,
    hop_trust: float,
) -> Confidence:
    """
    Compute confidence band for a single hop based on multi-signal agreement.

    Factors:
    1. GeoIP data availability and quality
    2. ASN cross-check (GeoLite2 vs Team Cymru agreement)
    3. Tor/VPN flags lower confidence
    4. RDAP data quality
    5. Hop trust score from header analysis
    """
    score = 0.0
    signals = 0

    # Factor 1: GeoIP data quality
    if geoip_data.get("country"):
        score += 0.2
        signals += 1
        if geoip_data.get("city"):
            score += 0.1
        if geoip_data.get("latitude") and geoip_data.get("longitude"):
            score += 0.1

    # Factor 2: ASN cross-check
    geoip_asn = geoip_data.get("asn", "")
    cymru_asn = asn_data.get("asn", "")
    if geoip_asn and cymru_asn:
        signals += 1
        if geoip_asn == cymru_asn:
            score += 0.25  # Strong agreement
        else:
            score -= 0.1  # Disagreement is suspicious

    # Factor 3: Tor/VPN flags
    if is_tor:
        score -= 0.3
        signals += 1
    elif is_vpn:
        score -= 0.2
        signals += 1

    # Factor 4: RDAP data quality
    if rdap_data.get("org"):
        score += 0.15
        signals += 1
    if rdap_data.get("country"):
        score += 0.05

        # Cross-check RDAP country with GeoIP country
        if geoip_data.get("country_code") and rdap_data.get("country"):
            rdap_country = rdap_data["country"].upper()
            geoip_country = str(geoip_data.get("country_code", "")).upper()
            if rdap_country == geoip_country:
                score += 0.1  # Country agreement
            # Note: RDAP country is registration country, may differ from hosting location

    # Factor 5: Hop trust score
    score += hop_trust * 0.2
    signals += 1

    # ── Map score to confidence band ────────────────────
    if signals == 0:
        return Confidence.INSUFFICIENT

    if score >= 0.6:
        return Confidence.HIGH
    elif score >= 0.3:
        return Confidence.MEDIUM
    elif score > 0:
        return Confidence.LOW
    else:
        return Confidence.INSUFFICIENT


def compute_overall_confidence(hop_confidences: List[Confidence]) -> Confidence:
    """
    Compute overall case confidence from individual hop confidences.

    Uses the weakest link principle — overall confidence cannot exceed
    the minimum of key hops (origin and any mid-chain hops).
    """
    if not hop_confidences:
        return Confidence.INSUFFICIENT

    priority = {
        Confidence.HIGH: 0,
        Confidence.MEDIUM: 1,
        Confidence.LOW: 2,
        Confidence.INSUFFICIENT: 3,
    }

    worst = max(priority[c] for c in hop_confidences)
    reverse_map = {v: k for k, v in priority.items()}
    return reverse_map[worst]


def build_attribution_summary(
    hops: List[Dict],
    overall_confidence: Confidence,
) -> Dict:
    """
    Build a human-readable attribution summary.

    This is the "honest uncertainty" output — never claims more
    certainty than the evidence supports.
    """
    summary = {
        "overall_confidence": overall_confidence.value,
        "hop_count": len(hops),
        "anonymizers_detected": [],
        "forged_hops": [],
        "attribution_statement": "",
    }

    origin_hop = hops[0] if hops else None

    for hop in hops:
        if hop.get("is_tor_exit"):
            summary["anonymizers_detected"].append(
                f"Tor exit node at Hop {hop['hop_index']} ({hop.get('ip_address', 'unknown')})"
            )
        if hop.get("is_vpn"):
            summary["anonymizers_detected"].append(
                f"VPN/hosting provider at Hop {hop['hop_index']} ({hop.get('asn', 'unknown')})"
            )
        if hop.get("is_forged"):
            summary["forged_hops"].append(
                f"Hop {hop['hop_index']}: {hop.get('hostname', 'unknown')} — likely forged"
            )

    # Build attribution statement
    if overall_confidence == Confidence.HIGH:
        country = origin_hop.get("country", "unknown") if origin_hop else "unknown"
        org = origin_hop.get("org", "unknown") if origin_hop else "unknown"
        summary["attribution_statement"] = (
            f"Origin attributed to {country} ({org}) with high confidence. "
            f"Multiple signals agree."
        )
    elif overall_confidence == Confidence.MEDIUM:
        summary["attribution_statement"] = (
            f"Origin tentatively attributed. "
            f"Some signals agree but {len(summary['anonymizers_detected'])} anonymizer(s) detected. "
            f"True origin may be obscured."
        )
    elif overall_confidence == Confidence.LOW:
        summary["attribution_statement"] = (
            f"Low confidence attribution. "
            f"Significant signal disagreement or anonymization layers present. "
            f"Origin cannot be reliably determined."
        )
    else:
        summary["attribution_statement"] = (
            "Insufficient evidence for attribution. "
            "Not enough verifiable data in the hop chain."
        )

    return summary
