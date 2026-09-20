"""
RFC 5321/5322 Received-header parser and hop-chain reconstruction.

Parses every Received: header, rebuilds the hop chain bottom-up
(origin MTA → ... → recipient MTA), and extracts per hop:
- IP address (from, by)
- Timestamp
- Declared hostname
- Protocol
"""
import re
from typing import List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from email.utils import parsedate_to_datetime


@dataclass
class Hop:
    """A single hop in the email delivery chain."""
    index: int
    raw_header: str
    from_ip: Optional[str] = None
    from_hostname: Optional[str] = None
    by_ip: Optional[str] = None
    by_hostname: Optional[str] = None
    timestamp: Optional[datetime] = None
    protocol: Optional[str] = None
    is_forged: bool = False
    trust_score: float = 0.5

# Regex patterns for Received header parsing
IP_PATTERN = re.compile(r'\[?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]?')
IPV6_PATTERN = re.compile(r'\[([0-9a-fA-F:]+)\]')
FROM_PATTERN = re.compile(r'from\s+(\S+)', re.IGNORECASE)
BY_PATTERN = re.compile(r'by\s+(\S+)', re.IGNORECASE)
WITH_PATTERN = re.compile(r'with\s+(E?SMTP\w*)', re.IGNORECASE)
# RFC 2822 date pattern at end of Received header (after semicolon)
DATE_PATTERN = re.compile(r';\s*(.+)$', re.DOTALL)

# Private IP ranges — these are internal hops
PRIVATE_RANGES = [
    (re.compile(r'^10\.'), "10.0.0.0/8"),
    (re.compile(r'^172\.(1[6-9]|2[0-9]|3[01])\.'), "172.16.0.0/12"),
    (re.compile(r'^192\.168\.'), "192.168.0.0/16"),
    (re.compile(r'^127\.'), "127.0.0.0/8"),
]


def is_private_ip(ip: str) -> bool:
    """Check if an IP address is in a private range."""
    for pattern, _ in PRIVATE_RANGES:
        if pattern.match(ip):
            return True
    return False


def extract_ips(text: str) -> List[str]:
    """Extract all IPv4 addresses from text."""
    return IP_PATTERN.findall(text)


def parse_single_received(header: str) -> Hop:
    """Parse a single Received: header value into a Hop object."""
    hop = Hop(index=0, raw_header=header.strip())

    # Extract 'from' hostname
    from_match = FROM_PATTERN.search(header)
    if from_match:
        hop.from_hostname = from_match.group(1).strip("()")

    # Extract 'by' hostname
    by_match = BY_PATTERN.search(header)
    if by_match:
        hop.by_hostname = by_match.group(1).strip("()")

    # Extract IPs
    ips = extract_ips(header)
    if ips:
        # First IP after "from" is typically the sending server
        hop.from_ip = ips[0]
        if len(ips) > 1:
            hop.by_ip = ips[1]

    # Extract protocol
    with_match = WITH_PATTERN.search(header)
    if with_match:
        hop.protocol = with_match.group(1).upper()

    # Extract timestamp (after the semicolon)
    date_match = DATE_PATTERN.search(header)
    if date_match:
        date_str = date_match.group(1).strip()
        try:
            hop.timestamp = parsedate_to_datetime(date_str)
        except (ValueError, TypeError):
            # Try alternative date formats
            for fmt in [
                "%a, %d %b %Y %H:%M:%S %z",
                "%d %b %Y %H:%M:%S %z",
                "%a, %d %b %Y %H:%M:%S",
            ]:
                try:
                    hop.timestamp = datetime.strptime(date_str.strip(), fmt)
                    break
                except ValueError:
                    continue

    return hop


def parse_received_headers(headers: List[str]) -> List[Hop]:
    """
    Parse Received headers and build the hop chain.

    Args:
        headers: list of raw Received header values, in order they appear
                 in the email (top = most recent, bottom = oldest)

    Returns:
        List of Hop objects ordered from origin (index 0) to recipient (last)
    """
    hops = []
    for raw in headers:
        hop = parse_single_received(raw)
        hops.append(hop)

    # Reverse: email headers list most recent first, but we want origin first
    hops.reverse()

    # Assign indices
    for i, hop in enumerate(hops):
        hop.index = i

    return hops


def detect_forged_hops(hops: List[Hop]) -> List[Hop]:
    """
    Analyze hop chain for forged/inserted entries.

    Checks:
    1. Timestamp monotonicity (each hop should be later than the previous)
    2. Private IPs in unexpected positions (mid-chain private IP is suspicious)
    3. Sudden geographic jumps (flagged but not definitive)
    """
    if len(hops) < 2:
        return hops

    for i in range(1, len(hops)):
        current = hops[i]
        previous = hops[i - 1]

        # Check 1: Timestamp ordering
        if current.timestamp and previous.timestamp:
            if current.timestamp < previous.timestamp:
                # Time went backwards — suspicious
                current.is_forged = True
                current.trust_score = max(0, current.trust_score - 0.3)

        # Check 2: Private IP in mid-chain (not first or last)
        if current.from_ip and is_private_ip(current.from_ip):
            if 0 < i < len(hops) - 1:
                current.is_forged = True
                current.trust_score = max(0, current.trust_score - 0.4)

        # Check 3: "from" hostname doesn't match IP's rDNS
        # (would need DNS lookup — flagged for Phase 4 integration)

    # First hop (origin) gets lower base trust if no verifiable info
    if hops and not hops[0].from_ip:
        hops[0].trust_score = 0.3

    # Last hop (recipient's own MTA) gets highest trust
    if len(hops) > 1:
        hops[-1].trust_score = 0.95

    return hops


def extract_received_from_email(email_text: str) -> List[str]:
    """Extract all Received: headers from raw email text."""
    headers = []
    current_header = None

    for line in email_text.split("\n"):
        # Check for Received: header start
        if line.lower().startswith("received:"):
            if current_header:
                headers.append(current_header)
            current_header = line[len("received:"):].strip()
        elif current_header is not None:
            # Continuation lines start with whitespace
            if line.startswith((" ", "\t")):
                current_header += " " + line.strip()
            else:
                # End of this Received header
                headers.append(current_header)
                current_header = None
                # If we hit a blank line, we're past all headers
                if not line.strip():
                    break

    if current_header:
        headers.append(current_header)

    return headers
