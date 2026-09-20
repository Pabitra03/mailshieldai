# MailShieldAI — API Contracts

> REST API documentation for the MailShieldAI backend

Base URL: `http://localhost:8000/api`

## Endpoints

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Ingestion

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ingest` | Ingest an email for analysis (.eml upload or raw source paste) |

**POST /api/ingest**
- Content-Type: `multipart/form-data`
- Parameters:
  - `file` (optional): .eml file upload
  - `raw_source` (optional): raw email source as text
- Response: `{ "status": "accepted", "case_id": "uuid" }`

### Cases

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases` | List all cases (paginated) |
| GET | `/api/cases/{case_id}` | Get full case detail |

### Geo-Intelligence

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases/{case_id}/geo` | Get geo-forensic hop chain |

### Evidence

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases/{case_id}/evidence` | Get evidence chain-of-custody |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases/{case_id}/report.pdf` | Download forensic report PDF |
| GET | `/api/cases/{case_id}/certificate.pdf` | Download BSA §63(4) certificate |

### Campaigns

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/campaigns` | List campaign clusters |
| GET | `/api/campaigns/{campaign_id}` | Get campaign graph detail |

### Verdicts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/verdicts` | List recent verdicts (paginated) |

---

*Full request/response schemas will be added as each endpoint is implemented in Phase 6.*
