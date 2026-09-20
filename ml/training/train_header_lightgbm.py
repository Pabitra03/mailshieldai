"""
Train LightGBM header forensics model.

Features engineered from email headers:
- SPF result (pass=0, fail=1, none=2)
- DKIM result (pass=0, fail=1, none=2)
- DMARC result (pass=0, fail=1, none=2)
- Hop count (number of Received headers)
- Display-name vs From-address mismatch (boolean)
- Reply-To mismatch (boolean)
- Has suspicious TLD (.xyz, .top, .click, etc.)
- Subject contains urgency keywords
- From domain age proxy (number of dots in domain)

For CSV-only samples (no real headers), derives proxy features from email text.
"""
import os
import sys
import argparse
import json
import re
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import lightgbm as lgb


SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".click", ".link", ".info", ".tk",
    ".ml", ".ga", ".cf", ".gq", ".buzz", ".club",
    ".online", ".site", ".work", ".icu",
}

URGENCY_KEYWORDS = [
    "urgent", "immediately", "suspend", "blocked", "verify",
    "confirm", "expire", "limited time", "act now", "warning",
    "alert", "security", "unauthorized", "compromised",
    "kyc", "update your", "click here", "action required",
]


def extract_header_features(row: dict) -> dict:
    """Extract ML features from email metadata/text."""
    text = str(row.get("text", "")).lower()
    label = str(row.get("label", "")).lower()

    features = {}

    # SPF/DKIM/DMARC — derive from text if present
    features["spf_fail"] = 1 if "spf=fail" in text or "spf: fail" in text else 0
    features["dkim_fail"] = 1 if "dkim=fail" in text or "dkim: fail" in text else 0
    features["dmarc_fail"] = 1 if "dmarc=fail" in text or "dmarc: fail" in text else 0
    features["spf_none"] = 1 if "spf=none" in text or "spf: none" in text else 0
    features["dkim_none"] = 1 if "dkim=none" in text or "dkim: none" in text else 0

    # Hop count proxy — count "received" occurrences
    features["hop_count"] = text.count("received:")
    features["hop_count_proxy"] = min(text.count("from "), 10)

    # Display name vs From mismatch proxy
    features["has_display_name_mismatch"] = 1 if re.search(
        r'"[^"]+"\s*<[^>]+>', text
    ) else 0

    # Reply-To mismatch proxy
    features["reply_to_mismatch"] = 1 if "reply-to:" in text and "from:" in text else 0

    # Suspicious TLD detection
    features["has_suspicious_tld"] = 0
    for tld in SUSPICIOUS_TLDS:
        if tld in text:
            features["has_suspicious_tld"] = 1
            break

    # Urgency score
    urgency_count = sum(1 for kw in URGENCY_KEYWORDS if kw in text)
    features["urgency_score"] = min(urgency_count, 10)
    features["has_urgency"] = 1 if urgency_count > 0 else 0

    # URL features
    urls = re.findall(r'https?://[^\s<>"\']+', text)
    features["url_count"] = len(urls)
    features["has_ip_url"] = 1 if any(re.search(r'https?://\d+\.\d+\.\d+\.\d+', u) for u in urls) else 0

    # Text statistics
    features["text_length"] = len(text)
    features["word_count"] = len(text.split())
    features["exclamation_count"] = text.count("!")
    features["question_count"] = text.count("?")
    features["all_caps_ratio"] = (
        sum(1 for c in str(row.get("text", "")) if c.isupper()) /
        max(len(str(row.get("text", ""))), 1)
    )

    # HTML detection
    features["has_html"] = 1 if "<html" in text or "<body" in text or "<a href" in text else 0

    # Attachment mention
    features["mentions_attachment"] = 1 if "attachment" in text or "attached" in text else 0

    # Financial keywords
    financial_keywords = ["bank", "account", "transfer", "payment", "credit card", "wire"]
    features["financial_keyword_count"] = sum(1 for kw in financial_keywords if kw in text)

    return features


def main():
    parser = argparse.ArgumentParser(description="Train header forensics LightGBM model")
    parser.add_argument("--data-path", default=None, help="Path to training CSV")
    parser.add_argument("--output-path", default=None, help="Model output path")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    args = parser.parse_args()

    data_path = args.data_path or str(Path(__file__).parent.parent / "data" / "training_merged.csv")
    output_path = args.output_path or str(Path(__file__).parent.parent / "models" / "header_lgbm.pkl")

    # Ensure output directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    print("🔬 Training Header Forensics LightGBM Model")
    print("=" * 50)

    # ── Load data ───────────────────────────────────────
    print(f"\n📂 Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    print(f"   Loaded {len(df):,} rows")

    # ── Extract features ────────────────────────────────
    print("\n⚙️  Extracting header features...")
    feature_rows = []
    for _, row in df.iterrows():
        features = extract_header_features(row.to_dict())
        feature_rows.append(features)

    feature_df = pd.DataFrame(feature_rows)
    feature_names = list(feature_df.columns)
    print(f"   Extracted {len(feature_names)} features: {feature_names}")

    # ── Prepare labels ──────────────────────────────────
    if "label_normalized" in df.columns:
        y = (df["label_normalized"] == "phishing").astype(int)
    elif "label" in df.columns:
        lbl = df["label"].astype(str).str.lower().str.strip()
        y = lbl.isin(["phishing", "spam", "1", "malicious", "fraud", "scam"]).astype(int)
    else:
        print("❌ No label column found!")
        return

    X = feature_df.values
    print(f"   Labels: {y.value_counts().to_dict()}")

    # ── Train/test split ────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42, stratify=y
    )
    print(f"\n📊 Split: {len(X_train):,} train, {len(X_test):,} test")

    # ── Train LightGBM ──────────────────────────────────
    print("\n🚀 Training LightGBM...")
    train_data = lgb.Dataset(X_train, label=y_train, feature_name=feature_names)
    test_data = lgb.Dataset(X_test, label=y_test, feature_name=feature_names, reference=train_data)

    params = {
        "objective": "binary",
        "metric": ["binary_logloss", "auc"],
        "boosting_type": "gbdt",
        "num_leaves": 31,
        "learning_rate": 0.05,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
        "n_jobs": -1,
    }

    callbacks = [lgb.log_evaluation(period=50)]
    model = lgb.train(
        params,
        train_data,
        num_boost_round=300,
        valid_sets=[test_data],
        callbacks=callbacks,
    )

    # ── Evaluate ────────────────────────────────────────
    y_pred_proba = model.predict(X_test)
    y_pred = (y_pred_proba > 0.5).astype(int)

    print("\n📈 Evaluation Results:")
    print(classification_report(y_test, y_pred, target_names=["legitimate", "phishing"]))

    try:
        auc = roc_auc_score(y_test, y_pred_proba)
        print(f"   AUC-ROC: {auc:.4f}")
    except Exception:
        pass

    # Feature importance
    importance = model.feature_importance(importance_type="gain")
    feat_imp = sorted(zip(feature_names, importance), key=lambda x: x[1], reverse=True)
    print("\n🔑 Top Feature Importances:")
    for name, imp in feat_imp[:10]:
        print(f"   {name}: {imp:.1f}")

    # ── Save model ──────────────────────────────────────
    model_artifact = {
        "model": model,
        "feature_names": feature_names,
        "feature_importances": dict(feat_imp),
        "params": params,
    }
    with open(output_path, "wb") as f:
        pickle.dump(model_artifact, f)
    print(f"\n✅ Model saved to {output_path}")


if __name__ == "__main__":
    main()
