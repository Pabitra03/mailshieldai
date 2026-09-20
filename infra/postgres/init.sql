-- MailShieldAI — PostgreSQL initialization
-- Creates tables for cases, evidence ledger, and geo hops

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Cases table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Email metadata
    message_id VARCHAR(512),
    subject VARCHAR(1024),
    sender VARCHAR(512),
    recipient VARCHAR(512),
    date_sent TIMESTAMP,
    body_text TEXT,
    body_html TEXT,
    headers_json JSONB,
    attachments_json JSONB,

    -- Verdict
    risk_score FLOAT,
    verdict VARCHAR(64),
    status VARCHAR(64) DEFAULT 'Processing',
    shap_explanation JSONB,

    -- Authentication results
    spf_result VARCHAR(32),
    dkim_result VARCHAR(32),
    dmarc_result VARCHAR(32),

    -- Geo summary
    origin_country VARCHAR(128),
    origin_city VARCHAR(128),
    origin_asn VARCHAR(64),
    geo_confidence VARCHAR(32),

    -- Evidence
    merkle_root VARCHAR(64),
    chain_verified BOOLEAN,

    -- Novelty flag
    is_novel BOOLEAN DEFAULT FALSE
);

-- ── Evidence ledger (hash-chained — Fabric stand-in) ──
CREATE TABLE IF NOT EXISTS evidence_ledger (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    payload_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    entry_hash VARCHAR(64) NOT NULL,
    payload_type VARCHAR(64) NOT NULL,
    payload_ref VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_ledger_case_id ON evidence_ledger(case_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_hash ON evidence_ledger(entry_hash);

-- ── Geo hops ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS geo_hops (
    id SERIAL PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    hop_index INTEGER NOT NULL,
    ip_address VARCHAR(64),
    hostname VARCHAR(512),
    "timestamp" TIMESTAMP,
    latitude FLOAT,
    longitude FLOAT,
    country VARCHAR(128),
    city VARCHAR(128),
    asn VARCHAR(64),
    org VARCHAR(256),
    is_forged BOOLEAN DEFAULT FALSE,
    is_tor_exit BOOLEAN DEFAULT FALSE,
    is_vpn BOOLEAN DEFAULT FALSE,
    trust_score FLOAT,
    confidence VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_hops_case_id ON geo_hops(case_id);

-- ── Evidence artifacts metadata ────────────────────────
CREATE TABLE IF NOT EXISTS evidence_artifacts (
    id SERIAL PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    name VARCHAR(512) NOT NULL,
    artifact_type VARCHAR(64) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    minio_key VARCHAR(512),
    content_type VARCHAR(128),
    size_bytes BIGINT
);

CREATE INDEX IF NOT EXISTS idx_artifacts_case_id ON evidence_artifacts(case_id);
