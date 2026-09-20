"""
Campaign service — Neo4j graph clustering of related threat emails.

Links emails to inferred threat actors via shared:
- Sender infrastructure (IPs, ASNs, domains)
- Content similarity (subject patterns, body templates)
- Temporal proximity
"""
