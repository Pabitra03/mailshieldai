"""
Evidence service — SHA-256, Merkle tree, hash-chain ledger, certificate PDF.

Orchestrates the evidence-vault module for:
- Artifact hashing (SHA-256)
- Merkle tree construction over case artifacts
- Hash-chained Postgres ledger (Hyperledger Fabric stand-in)
- MinIO WORM-style storage
- BSA 2023 §63(4) certificate PDF generation
"""
