"""
In-memory data models and case store for the demo.

In production, these would be SQLAlchemy ORM models + Pydantic schemas
backed by the Postgres tables defined in infra/postgres/init.sql.
"""
from typing import Dict, List

# ── In-memory case database (demo mode) ─────────────────
# Key: case_id (str), Value: case dict
CASES_DB: Dict[str, dict] = {}

# Generated report metadata for the demo UI. The PDFs themselves are generated
# on demand from case data, and these entries preserve the analyst workflow.
REPORTS_DB: List[dict] = []
