# MailShieldAI — Architecture

> Full production architecture mapping with MVP simplifications documented

## 10-Stage Production Architecture

```mermaid
graph LR
    A[Email Source] --> B[Ingestion]
    B --> C[Parsing & Enrichment]
    C --> D[AI Detection Engine]
    D --> E[Geo-Forensic Engine]
    E --> F[Evidence Vault]
    F --> G[Campaign Analysis]
    G --> H[Alert & Triage]
    H --> I[Analyst Console]
    I --> J[Reporting & Export]
```

## MVP vs. Production Mapping

| Component | Production Vision | MVP Implementation | Migration Path |
|-----------|-------------------|-------------------|----------------|
| **Event Bus** | Apache Kafka (raw.mail, parsed.mail, verdict, geo.intel, evidence) | Redis Streams with same topic names | Swap Redis client for Kafka client; topic names are identical |
| **Primary DB** | PostgreSQL + TimescaleDB + OpenSearch | PostgreSQL only | Add TimescaleDB extension for time-series queries; add OpenSearch for full-text |
| **Graph DB** | Neo4j Enterprise | Neo4j Community (Docker) | ✅ Same technology, just needs license upgrade |
| **Object Store** | MinIO with WORM compliance | MinIO with versioned bucket (Docker) | ✅ Same technology, enable compliance mode |
| **Evidence Anchoring** | Hyperledger Fabric blockchain | SHA-256 Merkle tree + hash-chained Postgres ledger | `ledger_chain.py` interface designed for Fabric swap-in |
| **ML - NLP** | IndicBERT (12 languages) | DistilBERT multilingual (English + Hindi) | Data problem not code problem — add training data per language |
| **ML - Brand** | CLIP embedding similarity | Perceptual hash (imagehash) | Upgrade path via `--use-clip` flag in training script |
| **Deployment** | Kubernetes + Helm + Prometheus/Grafana | docker-compose | Standard K8s migration — Dockerfiles already exist |
| **Federation** | Federated learning across deployments | Not implemented | Documented in design; requires multi-org infrastructure |

## Key Design Decisions

### Why Redis Streams over Kafka
- Same pub/sub semantics, consumer groups, message persistence
- No Zookeeper cluster to manage during a hackathon
- Topic names (`raw.mail`, `parsed.mail`, etc.) are identical — code migrates by changing the client library

### Why hash-chained ledger over Hyperledger Fabric
- Standing up Fabric is a multi-day task requiring multiple organizations, certificate authorities, and chaincode
- Hash-chain provides the same tamper-evidence property: `entry_hash = SHA256(payload_hash + previous_entry_hash)`
- Interface (`append()`, `verify_chain()`) is designed so Fabric can be swapped in without touching calling code

### Language Scope (2-3 vs. 12)
- The pipeline architecture supports any language the tokenizer handles
- Adding languages requires curated training data per language, not code changes
- English + Hindi demonstrates the multilingual capability; scaling is a data collection task
