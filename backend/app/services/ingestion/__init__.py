"""
Ingestion service — MIME parsing, header extraction, PII redaction.

Handles:
- .eml file parsing via Python's email package
- Header extraction (From, To, Subject, Date, Received, SPF/DKIM/DMARC, Message-ID)
- Body extraction (text + HTML)
- Attachment metadata (name, mimetype, hash — no detonation)
- Embedded image reference extraction (for brand-impersonation check)
- PII redaction for case storage (raw original preserved in evidence vault)
"""
