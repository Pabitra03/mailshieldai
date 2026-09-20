"""
Geo-forensics service — hop-chain rebuild, GeoIP/ASN, Tor/VPN unmask.

Orchestrates the geo-intel module for:
- RFC 5321/5322 Received-header reconstruction
- GeoIP (MaxMind GeoLite2) + ASN (Team Cymru) lookups
- RDAP registration data
- Tor exit / VPN proxy detection
- Multi-signal confidence fusion
"""
