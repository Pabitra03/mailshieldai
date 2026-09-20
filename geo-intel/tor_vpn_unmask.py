"""
Tor exit node and VPN/proxy detection.

Sources:
- Tor bulk exit list: https://check.torproject.org/torbulkexitlist
- Curated list of known VPN/hosting provider ASNs
"""
import os
import time
from pathlib import Path
from typing import Set, Optional

import httpx

# Cache directory
CACHE_DIR = Path(__file__).parent / ".cache"
TOR_EXIT_LIST_PATH = CACHE_DIR / "tor_exit_nodes.txt"
TOR_EXIT_URL = "https://check.torproject.org/torbulkexitlist"
CACHE_TTL = 86400  # 24 hours

# Known VPN/hosting ASNs — curated set
KNOWN_VPN_HOSTING_ASNS: Set[str] = {
    "AS14061",   # DigitalOcean
    "AS16509",   # Amazon / AWS
    "AS14618",   # Amazon / AWS
    "AS13335",   # Cloudflare
    "AS16276",   # OVH
    "AS24940",   # Hetzner
    "AS63949",   # Linode / Akamai
    "AS20473",   # Vultr
    "AS9009",    # M247 (NordVPN infrastructure)
    "AS212238",  # Datacamp (VPN providers)
    "AS206092",  # IPXO
    "AS51167",   # Contabo
    "AS45102",   # Alibaba Cloud
    "AS8075",    # Microsoft Azure
    "AS15169",   # Google Cloud
    "AS396982",  # Google Cloud
    "AS36352",   # ColoCrossing
    "AS46562",   # Performive (hosting)
    "AS397423",  # Tier.Net
}

# Hosting-only ASNs (less suspicious than VPN ASNs)
HOSTING_ASNS: Set[str] = {
    "AS15169", "AS8075", "AS16509", "AS14618",  # Big cloud
    "AS45102",  # Alibaba
}

_tor_exit_nodes: Optional[Set[str]] = None


def _load_tor_exit_list() -> Set[str]:
    """Load or download the Tor exit node list."""
    global _tor_exit_nodes

    if _tor_exit_nodes is not None:
        return _tor_exit_nodes

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Check cache freshness
    needs_refresh = True
    if TOR_EXIT_LIST_PATH.exists():
        age = time.time() - TOR_EXIT_LIST_PATH.stat().st_mtime
        if age < CACHE_TTL:
            needs_refresh = False

    if needs_refresh:
        try:
            resp = httpx.get(TOR_EXIT_URL, timeout=10)
            if resp.status_code == 200:
                TOR_EXIT_LIST_PATH.write_text(resp.text)
        except Exception:
            pass  # Use cached version if available

    # Parse the list
    nodes = set()
    if TOR_EXIT_LIST_PATH.exists():
        for line in TOR_EXIT_LIST_PATH.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                nodes.add(line)

    _tor_exit_nodes = nodes
    return nodes


def is_tor_exit(ip: str) -> bool:
    """Check if an IP is a known Tor exit node."""
    nodes = _load_tor_exit_list()
    return ip in nodes


def is_vpn_proxy(ip: str = None, asn: str = None) -> bool:
    """
    Check if an IP/ASN belongs to a known VPN or hosting provider.

    Returns True for VPN-associated ASNs (not just cloud hosting).
    """
    if asn:
        asn_upper = asn.upper()
        if not asn_upper.startswith("AS"):
            asn_upper = f"AS{asn_upper}"
        return asn_upper in KNOWN_VPN_HOSTING_ASNS

    return False


def is_hosting_only(asn: str) -> bool:
    """Check if ASN is a major cloud provider (less suspicious than VPN)."""
    if asn:
        asn_upper = asn.upper()
        if not asn_upper.startswith("AS"):
            asn_upper = f"AS{asn_upper}"
        return asn_upper in HOSTING_ASNS
    return False


def get_anonymizer_type(ip: str, asn: str = None) -> Optional[str]:
    """
    Determine the type of anonymizer for an IP/ASN.

    Returns: "tor", "vpn", "hosting", or None
    """
    if is_tor_exit(ip):
        return "tor"
    if asn and is_vpn_proxy(asn=asn) and not is_hosting_only(asn):
        return "vpn"
    if asn and is_hosting_only(asn):
        return "hosting"
    return None
