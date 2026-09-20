"""
RDAP (RFC 7482/9082) lookups for IP registration/organisation data.

Uses https://rdap.org as the bootstrap service.
"""
from typing import Dict

import httpx


RDAP_BOOTSTRAP = "https://rdap.org/ip/{ip}"


def lookup_rdap(ip: str) -> Dict:
    """
    Query RDAP for registration data on an IP address.

    Returns dict with name, org, country, address range, registration dates.
    """
    result = {
        "ip": ip,
        "name": None,
        "org": None,
        "country": None,
        "start_address": None,
        "end_address": None,
        "registration_date": None,
        "last_changed": None,
        "handle": None,
    }

    # Skip private IPs
    try:
        from hop_parser import is_private_ip
        if is_private_ip(ip):
            result["org"] = "Private Network"
            return result
    except ImportError:
        pass

    try:
        url = RDAP_BOOTSTRAP.format(ip=ip)
        resp = httpx.get(url, timeout=10, follow_redirects=True)

        if resp.status_code == 200:
            data = resp.json()

            result["name"] = data.get("name")
            result["handle"] = data.get("handle")
            result["start_address"] = data.get("startAddress")
            result["end_address"] = data.get("endAddress")
            result["country"] = data.get("country")

            # Extract org from entities
            for entity in data.get("entities", []):
                roles = entity.get("roles", [])
                if "registrant" in roles or "administrative" in roles:
                    vcard = entity.get("vcardArray", [])
                    if len(vcard) > 1:
                        for item in vcard[1]:
                            if item[0] == "org":
                                result["org"] = item[3]
                            elif item[0] == "fn":
                                if not result["org"]:
                                    result["org"] = item[3]

                # Try handle name as fallback
                if not result["org"] and entity.get("handle"):
                    result["org"] = entity.get("handle")

            # Extract dates from events
            for event in data.get("events", []):
                action = event.get("eventAction", "")
                date = event.get("eventDate", "")
                if action == "registration":
                    result["registration_date"] = date
                elif action == "last changed":
                    result["last_changed"] = date

    except httpx.TimeoutException:
        pass
    except Exception:
        pass

    return result
