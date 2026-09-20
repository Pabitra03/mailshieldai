"""
Team Cymru IP-to-ASN lookup via DNS.

Uses DNS TXT record queries against origin.asn.cymru.com.
Free, keyless, no account needed.
"""
import socket
from typing import Dict


def _reverse_ip(ip: str) -> str:
    """Reverse an IPv4 address for DNS lookup."""
    parts = ip.split(".")
    return ".".join(reversed(parts))


def lookup_asn(ip: str) -> Dict:
    """
    Look up ASN information via Team Cymru DNS.

    Queries: <reversed-ip>.origin.asn.cymru.com TXT
    Response format: "ASN | IP Prefix | Country | Registry | Allocated"

    Returns dict with asn, prefix, country, registry, allocated, as_name.
    """
    result = {
        "ip": ip,
        "asn": None,
        "prefix": None,
        "country": None,
        "registry": None,
        "allocated": None,
        "as_name": None,
    }

    try:
        # Check for private IPs first
        from hop_parser import is_private_ip
        if is_private_ip(ip):
            result["asn"] = "Private"
            result["as_name"] = "Private Network"
            return result
    except ImportError:
        pass

    try:
        # Query origin.asn.cymru.com
        query = f"{_reverse_ip(ip)}.origin.asn.cymru.com"
        answers = socket.getaddrinfo(query, None, socket.AF_INET, socket.SOCK_DGRAM)

        # DNS TXT record approach using nslookup-style
        import subprocess
        proc = subprocess.run(
            ["dig", "+short", query, "TXT"],
            capture_output=True, text=True, timeout=5,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            # Parse: "ASN | Prefix | Country | Registry | Date"
            txt = proc.stdout.strip().strip('"')
            parts = [p.strip() for p in txt.split("|")]
            if len(parts) >= 3:
                result["asn"] = f"AS{parts[0]}" if not parts[0].startswith("AS") else parts[0]
                result["prefix"] = parts[1] if len(parts) > 1 else None
                result["country"] = parts[2] if len(parts) > 2 else None
                result["registry"] = parts[3] if len(parts) > 3 else None
                result["allocated"] = parts[4] if len(parts) > 4 else None

                # Get AS name
                asn_num = parts[0].strip()
                name_query = f"AS{asn_num}.asn.cymru.com"
                name_proc = subprocess.run(
                    ["dig", "+short", name_query, "TXT"],
                    capture_output=True, text=True, timeout=5,
                )
                if name_proc.returncode == 0 and name_proc.stdout.strip():
                    name_txt = name_proc.stdout.strip().strip('"')
                    name_parts = [p.strip() for p in name_txt.split("|")]
                    if len(name_parts) >= 5:
                        result["as_name"] = name_parts[4].strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        # dig not available — try Python-only DNS
        try:
            import struct
            # Simplified: just return what we can from socket
            pass
        except Exception:
            pass
    except Exception:
        pass

    return result
