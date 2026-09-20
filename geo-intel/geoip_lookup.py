"""
MaxMind GeoLite2 city + ASN lookups.

Downloads the GeoLite2-City MMDB on first run using the license key from env.
Falls back to a free IP geolocation API if no license key is set.
"""
import os
import tarfile
import shutil
from pathlib import Path
from typing import Optional, Dict

import httpx

DB_DIR = Path(__file__).parent
CITY_DB_PATH = DB_DIR / "GeoLite2-City.mmdb"
ASN_DB_PATH = DB_DIR / "GeoLite2-ASN.mmdb"

# Try to import geoip2 (optional dependency)
try:
    import geoip2.database
    HAS_GEOIP2 = True
except ImportError:
    HAS_GEOIP2 = False


def download_geolite2_db():
    """Download GeoLite2 databases using the license key from env."""
    license_key = os.environ.get("GEOLITE2_LICENSE_KEY", "")
    if not license_key or license_key == "your_license_key_here":
        print("⚠️  GEOLITE2_LICENSE_KEY not set. Using fallback IP lookup API.")
        return False

    for edition, db_path in [("GeoLite2-City", CITY_DB_PATH), ("GeoLite2-ASN", ASN_DB_PATH)]:
        if db_path.exists():
            continue

        url = (
            f"https://download.maxmind.com/app/geoip_download"
            f"?edition_id={edition}&license_key={license_key}&suffix=tar.gz"
        )
        print(f"📥 Downloading {edition}...")
        try:
            resp = httpx.get(url, follow_redirects=True, timeout=60)
            resp.raise_for_status()

            tar_path = DB_DIR / f"{edition}.tar.gz"
            tar_path.write_bytes(resp.content)

            # Extract the .mmdb file
            with tarfile.open(tar_path, "r:gz") as tar:
                for member in tar.getmembers():
                    if member.name.endswith(".mmdb"):
                        f = tar.extractfile(member)
                        if f:
                            db_path.write_bytes(f.read())
                            print(f"✅ {edition} extracted to {db_path}")
                            break

            tar_path.unlink()
        except Exception as e:
            print(f"⚠️  Failed to download {edition}: {e}")
            return False

    return True


def _lookup_with_geoip2(ip: str) -> Dict:
    """Look up IP using local GeoLite2 database."""
    result = {
        "ip": ip,
        "latitude": None,
        "longitude": None,
        "country": None,
        "country_code": None,
        "city": None,
        "subdivision": None,
        "asn": None,
        "org": None,
    }

    if CITY_DB_PATH.exists():
        try:
            with geoip2.database.Reader(str(CITY_DB_PATH)) as reader:
                resp = reader.city(ip)
                result["latitude"] = resp.location.latitude
                result["longitude"] = resp.location.longitude
                result["country"] = resp.country.name
                result["country_code"] = resp.country.iso_code
                result["city"] = resp.city.name
                if resp.subdivisions:
                    result["subdivision"] = resp.subdivisions.most_specific.name
        except Exception:
            pass

    if ASN_DB_PATH.exists():
        try:
            with geoip2.database.Reader(str(ASN_DB_PATH)) as reader:
                resp = reader.asn(ip)
                result["asn"] = f"AS{resp.autonomous_system_number}"
                result["org"] = resp.autonomous_system_organization
        except Exception:
            pass

    return result


def _lookup_with_api(ip: str) -> Dict:
    """Fallback: look up IP using free API (ip-api.com)."""
    result = {
        "ip": ip,
        "latitude": None,
        "longitude": None,
        "country": None,
        "country_code": None,
        "city": None,
        "subdivision": None,
        "asn": None,
        "org": None,
    }

    try:
        resp = httpx.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": "status,country,countryCode,regionName,city,lat,lon,isp,org,as"},
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                result["latitude"] = data.get("lat")
                result["longitude"] = data.get("lon")
                result["country"] = data.get("country")
                result["country_code"] = data.get("countryCode")
                result["city"] = data.get("city")
                result["subdivision"] = data.get("regionName")
                result["org"] = data.get("org") or data.get("isp")
                as_str = data.get("as", "")
                if as_str:
                    result["asn"] = as_str.split(" ")[0]
    except Exception:
        pass

    return result


def lookup_ip(ip: str) -> Dict:
    """
    Look up an IP address — uses GeoLite2 if available, falls back to API.

    Returns dict with: ip, latitude, longitude, country, city, asn, org, etc.
    """
    # Skip private/reserved IPs
    from hop_parser import is_private_ip
    if is_private_ip(ip):
        return {
            "ip": ip, "latitude": None, "longitude": None,
            "country": "Private", "city": None, "subdivision": None,
            "asn": None, "org": "Private Network", "country_code": None,
        }

    if HAS_GEOIP2 and (CITY_DB_PATH.exists() or ASN_DB_PATH.exists()):
        return _lookup_with_geoip2(ip)
    else:
        return _lookup_with_api(ip)


# Try to download DBs on module import
try:
    if not CITY_DB_PATH.exists():
        download_geolite2_db()
except Exception:
    pass
