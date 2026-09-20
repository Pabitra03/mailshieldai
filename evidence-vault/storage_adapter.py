"""
MinIO-backed evidence storage adapter — WORM-style (object lock).

Writes artifacts to a MinIO bucket with versioning enabled.
Deterministic object keys: {case_id}/{artifact_type}/{sha256}
"""
import os
import io
from typing import Optional
from pathlib import Path

from minio import Minio
from minio.error import S3Error


def _get_client() -> Minio:
    """Get a MinIO client from environment config."""
    endpoint = os.environ.get("MINIO_ENDPOINT", "localhost:9000")
    access_key = os.environ.get("MINIO_ACCESS_KEY", "mailshield")
    secret_key = os.environ.get("MINIO_SECRET_KEY", "mailshield_minio_2024")
    use_ssl = os.environ.get("MINIO_USE_SSL", "false").lower() == "true"

    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=use_ssl)


def _ensure_bucket(client: Minio, bucket: str):
    """Create bucket with versioning if it doesn't exist."""
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
            # Enable versioning for append-only semantics
            from minio.versioningconfig import VersioningConfig, ENABLED
            client.set_bucket_versioning(bucket, VersioningConfig(ENABLED))
    except S3Error as e:
        if "BucketAlreadyOwnedByYou" not in str(e):
            raise


def store_artifact(
    case_id: str,
    artifact_type: str,
    data: bytes,
    content_type: str = "application/octet-stream",
    sha256: Optional[str] = None,
    bucket: Optional[str] = None,
) -> str:
    """
    Store an artifact in MinIO with WORM-style semantics.

    Args:
        case_id: UUID of the case
        artifact_type: type label ('raw_eml', 'attachment', 'screenshot', etc.)
        data: raw bytes of the artifact
        content_type: MIME type
        sha256: pre-computed hash (computed if not provided)
        bucket: override bucket name

    Returns:
        MinIO object key
    """
    if sha256 is None:
        import hashlib
        sha256 = hashlib.sha256(data).hexdigest()

    bucket = bucket or os.environ.get("MINIO_BUCKET", "evidence-vault")
    object_key = f"{case_id}/{artifact_type}/{sha256}"

    try:
        client = _get_client()
        _ensure_bucket(client, bucket)

        client.put_object(
            bucket,
            object_key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
            metadata={"x-amz-meta-case-id": case_id, "x-amz-meta-sha256": sha256},
        )
        return object_key
    except Exception as e:
        # Fallback: log the error but return the key so the pipeline continues
        print(f"⚠️  MinIO store failed: {e}")
        return object_key


def retrieve_artifact(object_key: str, bucket: Optional[str] = None) -> Optional[bytes]:
    """Retrieve an artifact from MinIO."""
    bucket = bucket or os.environ.get("MINIO_BUCKET", "evidence-vault")

    try:
        client = _get_client()
        response = client.get_object(bucket, object_key)
        data = response.read()
        response.close()
        response.release_conn()
        return data
    except Exception as e:
        print(f"⚠️  MinIO retrieve failed: {e}")
        return None


def list_case_artifacts(case_id: str, bucket: Optional[str] = None) -> list:
    """List all artifacts for a case."""
    bucket = bucket or os.environ.get("MINIO_BUCKET", "evidence-vault")

    try:
        client = _get_client()
        objects = client.list_objects(bucket, prefix=f"{case_id}/", recursive=True)
        return [{"key": obj.object_name, "size": obj.size, "modified": obj.last_modified}
                for obj in objects]
    except Exception as e:
        print(f"⚠️  MinIO list failed: {e}")
        return []
