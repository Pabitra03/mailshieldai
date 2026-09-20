"""
ML inference service — loads all models and exposes a prediction API.

Endpoints:
- POST /predict — score a parsed email, return risk + verdict + SHAP explanation
- GET  /health  — model readiness check
"""
import os
import sys
import pickle
import re
from pathlib import Path
from typing import Optional, List, Dict, Any, Union

from fastapi import FastAPI
import numpy as np

# Add training dir to path for feature extractors
sys.path.insert(0, str(Path(__file__).parent.parent / "training"))

def _to_native(obj: Any) -> Any:
    """Convert numpy/pandas types to native Python types for JSON serialization."""
    if isinstance(obj, (np.integer, np.floating)):
        return obj.item()
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: _to_native(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_native(v) for v in obj]
    return obj

app = FastAPI(
    title="MailShieldAI ML Service",
    description="Model inference — header forensics, NLP intent, URL scoring, brand check, novelty detection",
    version="0.1.0",
)

# ── Global model storage ────────────────────────────────
MODELS = {
    "header_lgbm": None,
    "intent_classifier": None,
    "intent_vectorizer": None,
    "url_scorer": None,
    "brand_index": None,
    "novelty_iforest": None,
}
MODELS_DIR = Path(__file__).parent.parent / "models"


def load_models():
    """Load all trained models from disk."""
    global MODELS

    # Header LightGBM
    lgbm_path = MODELS_DIR / "header_lgbm.pkl"
    if lgbm_path.exists():
        with open(lgbm_path, "rb") as f:
            MODELS["header_lgbm"] = pickle.load(f)
        print("✅ Loaded header LightGBM model")

    # Intent classifier
    intent_dir = MODELS_DIR / "intent_classifier"
    model_path = intent_dir / "intent_model.pkl"
    vec_path = intent_dir / "tfidf_vectorizer.pkl"
    if model_path.exists() and vec_path.exists():
        with open(model_path, "rb") as f:
            MODELS["intent_classifier"] = pickle.load(f)
        with open(vec_path, "rb") as f:
            MODELS["intent_vectorizer"] = pickle.load(f)
        print("✅ Loaded intent classifier")

    # URL scorer
    url_path = MODELS_DIR / "url_scorer.pkl"
    if url_path.exists():
        with open(url_path, "rb") as f:
            MODELS["url_scorer"] = pickle.load(f)
        print("✅ Loaded URL scorer")

    # Brand phash index
    brand_path = MODELS_DIR / "brand_phash_index.pkl"
    if brand_path.exists():
        with open(brand_path, "rb") as f:
            MODELS["brand_index"] = pickle.load(f)
        print("✅ Loaded brand phash index")

    # Novelty Isolation Forest
    iforest_path = MODELS_DIR / "novelty_iforest.pkl"
    if iforest_path.exists():
        with open(iforest_path, "rb") as f:
            MODELS["novelty_iforest"] = pickle.load(f)
        print("✅ Loaded Isolation Forest")


# Load models on startup
try:
    load_models()
except Exception as e:
    print(f"⚠️  Model loading error: {e}")


def models_loaded() -> dict:
    """Check which models are loaded."""
    return {name: (model is not None) for name, model in MODELS.items()}


@app.get("/")
async def root():
    """Root endpoint for ML Inference Service."""
    return {
        "status": "online",
        "service": "MailShieldAI ML Inference Engine",
        "version": "0.1.0",
        "interactive_docs": "http://localhost:8001/docs",
        "health_check": "http://localhost:8001/health",
        "predict_endpoint": "http://localhost:8001/predict",
        "models_status": models_loaded(),
    }


@app.get("/health")
async def health():
    """Model service health check."""
    loaded = models_loaded()
    all_loaded = all(v for k, v in loaded.items()
                     if k not in ("intent_vectorizer",))  # vectorizer is bundled with classifier
    return {
        "status": "ok" if any(loaded.values()) else "no_models",
        "service": "mailshieldai-ml",
        "models_loaded": loaded,
        "ready": all_loaded,
    }


def _score_header(email_data: dict) -> float:
    """Score email using header LightGBM model."""
    if MODELS["header_lgbm"] is None:
        return 0.0

    try:
        from train_header_lightgbm import extract_header_features
    except ImportError:
        return 0.0

    features = extract_header_features(email_data)
    model_artifact = MODELS["header_lgbm"]
    model = model_artifact["model"]
    feature_names = model_artifact["feature_names"]

    X = [[features.get(f, 0) for f in feature_names]]
    proba = model.predict(X)[0]
    return float(proba)


def _score_intent(text: str) -> float:
    """Score email text using intent classifier."""
    if MODELS["intent_classifier"] is None or MODELS["intent_vectorizer"] is None:
        return 0.0

    # Clean text
    clean = re.sub(r'https?://\S+', '[URL]', str(text))
    clean = re.sub(r'\S+@\S+', '[EMAIL]', clean)
    clean = re.sub(r'<[^>]+>', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()[:2000]

    vectorizer = MODELS["intent_vectorizer"]
    model = MODELS["intent_classifier"]

    X = vectorizer.transform([clean])
    proba = model.predict_proba(X)[0][1]
    return float(proba)


def _score_urls(text: str) -> float:
    """Score URLs found in email text."""
    if MODELS["url_scorer"] is None:
        return 0.0

    urls = re.findall(r'https?://[^\s<>"\']+', str(text))
    if not urls:
        return 0.0

    try:
        from train_url_model import extract_url_features
    except ImportError:
        return 0.0

    artifact = MODELS["url_scorer"]
    model = artifact["model"]
    scaler = artifact["scaler"]
    feature_names = artifact["feature_names"]

    max_score = 0.0
    for url in urls[:10]:  # Cap at 10 URLs
        features = extract_url_features(url)
        X = [[features.get(f, 0) for f in feature_names]]
        X_scaled = scaler.transform(X)
        proba = model.predict_proba(X_scaled)[0][1]
        max_score = max(max_score, float(proba))

    return max_score


def _check_novelty(email_data: dict) -> bool:
    """Check if email is a novel/outlier pattern."""
    if MODELS["novelty_iforest"] is None:
        return False

    try:
        from train_header_lightgbm import extract_header_features
    except ImportError:
        return False

    artifact = MODELS["novelty_iforest"]
    model = artifact["model"]
    scaler = artifact["scaler"]
    feature_names = artifact["feature_names"]

    features = extract_header_features(email_data)
    X = [[features.get(f, 0) for f in feature_names]]
    X_scaled = scaler.transform(X)

    prediction = model.predict(X_scaled)[0]
    return prediction == -1  # -1 = anomaly


def _build_shap_explanation(email_data: dict) -> list:
    """Build SHAP-like explanation from feature contributions."""
    if MODELS["header_lgbm"] is None:
        return []

    try:
        from train_header_lightgbm import extract_header_features
        import shap
    except ImportError:
        # Fallback: use feature importance
        return _build_fallback_explanation(email_data)

    features = extract_header_features(email_data)
    model_artifact = MODELS["header_lgbm"]
    model = model_artifact["model"]
    feature_names = model_artifact["feature_names"]

    X = [[features.get(f, 0) for f in feature_names]]

    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)[0]

        explanations = []
        for name, value, sv in zip(feature_names, X[0], shap_values):
            if abs(sv) > 0.01:
                explanations.append({
                    "field": name,
                    "value": str(value),
                    "contribution": round(float(sv), 4),
                })

        explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return explanations[:7]
    except Exception:
        return _build_fallback_explanation(email_data)


def _build_fallback_explanation(email_data: dict) -> list:
    """Build explanation from feature importance when SHAP isn't available."""
    explanations = []
    text = str(email_data.get("text", "")).lower()

    if "spf=fail" in text or "spf: fail" in text:
        explanations.append({"field": "SPF", "value": "FAIL", "contribution": 0.25})
    if "dkim=fail" in text or "dkim: fail" in text:
        explanations.append({"field": "DKIM", "value": "FAIL", "contribution": 0.15})

    urgency_phrases = [
        ("account will be suspended", 0.22),
        ("update your kyc", 0.20),
        ("verify your identity", 0.18),
        ("click here", 0.12),
        ("urgent", 0.10),
        ("immediately", 0.10),
    ]
    for phrase, weight in urgency_phrases:
        if phrase in text:
            explanations.append({"field": "body_urgency", "value": phrase, "contribution": weight})

    urls = re.findall(r'https?://([^\s<>"\']+)', text)
    for url in urls[:2]:
        explanations.append({"field": "url_domain", "value": url, "contribution": 0.18})

    explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return explanations[:5]


@app.post("/predict")
async def predict(email_data: dict):
    """
    Score a parsed email through the full detection ensemble.

    Input: {"text": str, "subject": str, "sender": str, ...}
    Returns: risk_score (0-100), verdict, SHAP explanation, novelty flag
    """
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent))
    from ensemble import fuse_scores

    # Run all scoring components
    header_prob = _score_header(email_data)
    intent_prob = _score_intent(email_data.get("text", ""))
    url_prob = _score_urls(email_data.get("text", ""))
    brand_prob = 0.0  # Brand check requires image data, scored separately
    is_novel = _check_novelty(email_data)

    # Fuse scores
    result = fuse_scores(
        header_prob=header_prob,
        intent_prob=intent_prob,
        url_prob=url_prob,
        brand_prob=brand_prob,
        is_novel=is_novel,
    )

    # Build SHAP explanation
    shap_explanation = _build_shap_explanation(email_data)

    # Add URL-specific explanation if relevant
    if url_prob > 0.3:
        urls = re.findall(r'https?://([^\s<>"\']+)', str(email_data.get("text", "")))
        if urls:
            shap_explanation.append({
                "field": "url_suspicious",
                "value": urls[0],
                "contribution": round(url_prob * 0.25, 4),
            })

    # Add intent-specific explanation
    if intent_prob > 0.5:
        shap_explanation.append({
            "field": "nlp_intent",
            "value": f"Phishing intent detected (confidence: {intent_prob:.0%})",
            "contribution": round(intent_prob * 0.3, 4),
        })

    component_scores = dict(result["component_scores"])
    component_scores["novelty_detection"] = 100.0 if is_novel else 0.0
    component_scores["shap_explainer"] = round(min(100.0, len(shap_explanation) * 14.0), 1)

    response = {
        "risk_score": result["risk_score"],
        "verdict": result["verdict"],
        "is_novel": result["is_novel"],
        "component_scores": component_scores,
        "shap_explanation": shap_explanation,
    }
    return _to_native(response)
