"""
SHAP explainability wrapper.

Provides SHAP-based explanations for the header LightGBM model.
Falls back to feature-importance-based explanations when SHAP isn't available.
"""
import pickle
import sys
from pathlib import Path
from typing import List, Dict, Optional

import numpy as np

# Add training dir to path
sys.path.insert(0, str(Path(__file__).parent.parent / "training"))

MODELS_DIR = Path(__file__).parent.parent / "models"


def explain_prediction(
    email_data: dict,
    model_path: Optional[str] = None,
    top_k: int = 7,
) -> List[Dict]:
    """
    Generate SHAP explanation for a header model prediction.

    Returns top-K feature contributions sorted by absolute impact.
    """
    model_path = model_path or str(MODELS_DIR / "header_lgbm.pkl")

    try:
        with open(model_path, "rb") as f:
            artifact = pickle.load(f)
    except (FileNotFoundError, pickle.UnpicklingError):
        return _fallback_explanation(email_data)

    model = artifact["model"]
    feature_names = artifact["feature_names"]

    # Extract features
    try:
        from train_header_lightgbm import extract_header_features
    except ImportError:
        return _fallback_explanation(email_data)

    features = extract_header_features(email_data)
    X = np.array([[features.get(f, 0) for f in feature_names]])

    # Try SHAP TreeExplainer
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)[0]

        explanations = []
        for name, value, sv in zip(feature_names, X[0], shap_values):
            if abs(sv) > 0.005:
                explanations.append({
                    "field": name,
                    "value": _format_value(name, value),
                    "contribution": round(float(sv), 4),
                    "direction": "increases risk" if sv > 0 else "decreases risk",
                })

        explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return explanations[:top_k]

    except ImportError:
        # SHAP not available — use feature importance
        return _importance_explanation(model, feature_names, X[0], top_k)
    except Exception:
        return _fallback_explanation(email_data)


def _importance_explanation(model, feature_names, feature_values, top_k) -> List[Dict]:
    """Explain using global feature importance as a proxy."""
    importance = model.feature_importance(importance_type="gain")
    total = sum(importance) or 1

    explanations = []
    for name, imp, val in zip(feature_names, importance, feature_values):
        if imp > 0 and val != 0:
            relative_imp = imp / total
            explanations.append({
                "field": name,
                "value": _format_value(name, val),
                "contribution": round(relative_imp, 4),
                "direction": "increases risk" if val > 0.5 else "informational",
            })

    explanations.sort(key=lambda x: x["contribution"], reverse=True)
    return explanations[:top_k]


def _fallback_explanation(email_data: dict) -> List[Dict]:
    """Simple rule-based explanation when models aren't available."""
    import re
    text = str(email_data.get("text", "")).lower()
    explanations = []

    checks = [
        ("spf=fail" in text, "SPF", "FAIL", 0.25),
        ("dkim=fail" in text, "DKIM", "FAIL", 0.15),
        ("urgent" in text or "immediately" in text, "body_urgency", "Urgency language detected", 0.20),
        (bool(re.search(r'https?://[^\s]+\.(xyz|top|click|tk)', text)), "url_suspicious_tld", "Suspicious TLD in URL", 0.18),
        ("verify" in text and ("kyc" in text or "account" in text), "social_engineering", "Credential harvesting language", 0.15),
    ]

    for condition, field, value, contribution in checks:
        if condition:
            explanations.append({
                "field": field,
                "value": value,
                "contribution": contribution,
                "direction": "increases risk",
            })

    return explanations[:5]


def _format_value(name: str, value) -> str:
    """Format a feature value for human display."""
    if isinstance(value, float):
        if value == 0.0 or value == 1.0:
            return "Yes" if value == 1.0 else "No"
        return f"{value:.3f}"
    return str(value)
