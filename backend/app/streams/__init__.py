"""
Redis Streams producer/consumer helpers.

Logical topic names (matching the production Kafka architecture):
- raw.mail     — raw email ingested, awaiting parsing
- parsed.mail  — parsed email ready for ML scoring
- verdict      — ML verdict produced
- geo.intel    — geo-forensic analysis complete
- evidence     — evidence sealed in vault
"""
import json
from typing import Optional, Dict, Any, Callable, Awaitable

import redis.asyncio as aioredis
from app.core.config import settings


# Stream/topic names — same as production Kafka topics
STREAM_RAW_MAIL = "raw.mail"
STREAM_PARSED_MAIL = "parsed.mail"
STREAM_VERDICT = "verdict"
STREAM_GEO_INTEL = "geo.intel"
STREAM_EVIDENCE = "evidence"

ALL_STREAMS = [
    STREAM_RAW_MAIL,
    STREAM_PARSED_MAIL,
    STREAM_VERDICT,
    STREAM_GEO_INTEL,
    STREAM_EVIDENCE,
]


async def get_redis() -> aioredis.Redis:
    """Get an async Redis connection."""
    return aioredis.from_url(settings.redis_url, decode_responses=True)


async def publish(stream: str, data: Dict[str, Any]) -> str:
    """
    Publish a message to a Redis Stream.
    Returns the message ID.
    """
    r = await get_redis()
    try:
        msg_id = await r.xadd(stream, {"payload": json.dumps(data)})
        return msg_id
    finally:
        await r.aclose()


async def consume_latest(stream: str, count: int = 10) -> list:
    """
    Read the latest `count` messages from a stream.
    Returns list of (message_id, payload_dict) tuples.
    """
    r = await get_redis()
    try:
        messages = await r.xrevrange(stream, count=count)
        results = []
        for msg_id, fields in messages:
            payload = json.loads(fields.get("payload", "{}"))
            results.append((msg_id, payload))
        return results
    finally:
        await r.aclose()
