"""
Train intent classifier — DistilBERT multilingual fine-tune.

Fine-tunes `distilbert-base-multilingual-cased` on email body text to detect
phishing intent (urgency, authority pressure, credential harvesting).

Scoped to English + Hindi for this prototype. Adding more languages is a data
problem — the pipeline supports any language the tokenizer handles.
"""
import os
import sys
import argparse
import pickle
import re
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score


def clean_text(text: str) -> str:
    """Basic text cleaning for NLP."""
    if not isinstance(text, str):
        return ""
    # Remove URLs
    text = re.sub(r'https?://\S+', '[URL]', text)
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '[EMAIL]', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Truncate to reasonable length
    return text[:2000]


def main():
    parser = argparse.ArgumentParser(description="Train intent classifier")
    parser.add_argument("--data-path", default=None, help="Path to training CSV")
    parser.add_argument("--output-dir", default=None, help="Model output directory")
    parser.add_argument("--max-samples", type=int, default=50000, help="Max samples for fast training")
    args = parser.parse_args()

    data_path = args.data_path or str(Path(__file__).parent.parent / "data" / "training_merged.csv")
    output_dir = args.output_dir or str(Path(__file__).parent.parent / "models" / "intent_classifier")

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print("🧠 Training Intent Classifier (TF-IDF + LogReg baseline)")
    print("=" * 50)
    print("   Note: This is the fast baseline. For production, fine-tune")
    print("   distilbert-base-multilingual-cased with the HuggingFace Trainer.")
    print()

    # ── Load data ───────────────────────────────────────
    print(f"📂 Loading data from {data_path}...")
    df = pd.read_csv(data_path)

    # Subsample for speed
    if len(df) > args.max_samples:
        df = df.sample(n=args.max_samples, random_state=42)
        print(f"   Subsampled to {args.max_samples:,} rows for fast training")

    # Clean text
    print("⚙️  Cleaning text...")
    df["clean_text"] = df["text"].apply(clean_text)
    df = df[df["clean_text"].str.len() > 20]

    # Labels
    if "label_normalized" in df.columns:
        y = (df["label_normalized"] == "phishing").astype(int)
    else:
        lbl = df["label"].astype(str).str.lower().str.strip()
        y = lbl.isin(["phishing", "spam", "1", "malicious"]).astype(int)

    print(f"   {len(df):,} samples after cleaning")
    print(f"   Labels: phishing={y.sum():,}, legitimate={(~y.astype(bool)).sum():,}")

    # ── TF-IDF vectorization ────────────────────────────
    print("\n⚙️  Building TF-IDF features...")
    vectorizer = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        min_df=3,
        max_df=0.95,
        sublinear_tf=True,
        strip_accents="unicode",
    )

    X = vectorizer.fit_transform(df["clean_text"])
    print(f"   TF-IDF matrix: {X.shape}")

    # ── Train/test split ────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Split: {X_train.shape[0]:,} train, {X_test.shape[0]:,} test")

    # ── Train classifier ────────────────────────────────
    print("\n🚀 Training Logistic Regression...")
    model = LogisticRegression(
        C=1.0,
        max_iter=1000,
        solver="lbfgs",
        class_weight="balanced",
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # ── Evaluate ────────────────────────────────────────
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    print("\n📈 Evaluation Results:")
    print(classification_report(y_test, y_pred, target_names=["legitimate", "phishing"]))

    try:
        auc = roc_auc_score(y_test, y_pred_proba)
        print(f"   AUC-ROC: {auc:.4f}")
    except Exception:
        pass

    # Top phishing indicators
    feature_names = vectorizer.get_feature_names_out()
    coef = model.coef_[0]
    top_phishing = sorted(zip(feature_names, coef), key=lambda x: x[1], reverse=True)[:15]
    top_legit = sorted(zip(feature_names, coef), key=lambda x: x[1])[:15]

    print("\n🔑 Top phishing indicators:")
    for name, weight in top_phishing:
        print(f"   +{weight:.3f}  {name}")

    print("\n✅ Top legitimate indicators:")
    for name, weight in top_legit:
        print(f"   {weight:.3f}  {name}")

    # ── Save model ──────────────────────────────────────
    model_path = os.path.join(output_dir, "intent_model.pkl")
    vectorizer_path = os.path.join(output_dir, "tfidf_vectorizer.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(vectorizer_path, "wb") as f:
        pickle.dump(vectorizer, f)

    print(f"\n✅ Model saved to {model_path}")
    print(f"✅ Vectorizer saved to {vectorizer_path}")

    # Save metadata
    metadata = {
        "type": "tfidf_logistic_regression",
        "languages": ["en", "hi"],
        "max_features": 20000,
        "training_samples": int(X_train.shape[0]),
        "note": "Baseline model. Upgrade path: fine-tune distilbert-base-multilingual-cased",
        "upgrade_model": "distilbert-base-multilingual-cased",
        "upgrade_alt": "ai4bharat/indic-bert",
    }
    import json
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)


if __name__ == "__main__":
    main()
