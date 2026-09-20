"""
Train URL & domain scorer.

Features: URL length, path depth, entropy, homoglyph distance to
known Indian bank/govt domains, suspicious TLDs, IP-as-hostname, etc.
"""
import os
import sys
import argparse
import pickle
import re
import math
from pathlib import Path
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler

# Known legitimate Indian bank/govt domains for homoglyph distance
KNOWN_DOMAINS = [
    "rbi.org.in", "sbi.co.in", "onlinesbi.com", "hdfcbank.com",
    "icicibank.com", "pnbindia.in", "bankofbaroda.in", "canarabank.com",
    "uidai.gov.in", "incometax.gov.in", "incometaxindiaefiling.gov.in",
    "paytm.com", "phonepe.com", "gpay.google.com", "indianpost.gov.in",
    "epfindia.gov.in", "irctc.co.in",
]

SUSPICIOUS_TLDS = {
    "xyz", "top", "click", "link", "tk", "ml", "ga", "cf", "gq",
    "buzz", "club", "online", "site", "work", "icu", "info", "pw",
}


def shannon_entropy(s: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not s:
        return 0.0
    counts = Counter(s)
    length = len(s)
    return -sum(
        (count / length) * math.log2(count / length)
        for count in counts.values()
    )


def levenshtein_distance(s1: str, s2: str) -> int:
    """Simple Levenshtein distance."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = prev_row[j + 1] + 1
            deletions = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row
    return prev_row[-1]


def extract_url_features(url: str) -> dict:
    """Extract features from a URL string."""
    features = {}

    url = str(url).strip()
    url_lower = url.lower()

    # Basic length features
    features["url_length"] = len(url)
    features["path_depth"] = url.count("/") - 2  # subtract protocol slashes

    # Domain extraction
    domain = ""
    try:
        if "://" in url:
            domain = url.split("://")[1].split("/")[0].split(":")[0]
        else:
            domain = url.split("/")[0].split(":")[0]
    except (IndexError, ValueError):
        pass

    features["domain_length"] = len(domain)
    features["domain_dot_count"] = domain.count(".")
    features["domain_hyphen_count"] = domain.count("-")
    features["domain_digit_count"] = sum(c.isdigit() for c in domain)

    # Entropy
    features["url_entropy"] = shannon_entropy(url)
    features["domain_entropy"] = shannon_entropy(domain)

    # Suspicious TLD
    tld = domain.split(".")[-1] if "." in domain else ""
    features["has_suspicious_tld"] = 1 if tld in SUSPICIOUS_TLDS else 0

    # IP address as hostname
    features["is_ip_hostname"] = 1 if re.match(r'^\d+\.\d+\.\d+\.\d+$', domain) else 0

    # Has @ symbol (URL obfuscation)
    features["has_at_symbol"] = 1 if "@" in url else 0

    # Has port number
    features["has_port"] = 1 if re.search(r':\d{2,5}/', url) else 0

    # HTTPS vs HTTP
    features["is_https"] = 1 if url_lower.startswith("https") else 0

    # Homoglyph/typosquat distance to known domains
    min_dist = 999
    for known in KNOWN_DOMAINS:
        dist = levenshtein_distance(domain.lower(), known)
        if dist < min_dist:
            min_dist = dist
    features["min_known_domain_distance"] = min_dist
    features["is_near_known_domain"] = 1 if 0 < min_dist <= 3 else 0

    # Special characters
    features["special_char_count"] = sum(1 for c in url if c in "!@#$%^&*()=+[]{}|;:',<>?~`")

    # Query parameters
    features["has_query_params"] = 1 if "?" in url else 0
    features["query_param_count"] = url.count("&") + (1 if "?" in url else 0)

    # Subdomain count
    features["subdomain_count"] = max(0, domain.count(".") - 1)

    return features


def main():
    parser = argparse.ArgumentParser(description="Train URL/domain scorer")
    parser.add_argument("--data-path", default=None, help="Path to URL dataset")
    parser.add_argument("--output-path", default=None, help="Model output path")
    args = parser.parse_args()

    output_path = args.output_path or str(Path(__file__).parent.parent / "models" / "url_scorer.pkl")
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    print("🔗 Training URL & Domain Scorer")
    print("=" * 50)

    # ── Load URL dataset ────────────────────────────────
    url_path = Path(__file__).parent.parent / "data" / "url_dataset"

    if url_path.exists():
        print(f"📂 Loading URL dataset from {url_path}...")
        try:
            from datasets import load_from_disk
            ds = load_from_disk(str(url_path))
            # Get the first available split
            split_name = list(ds.keys())[0] if hasattr(ds, 'keys') else 'train'
            df = ds[split_name].to_pandas() if hasattr(ds, '__getitem__') and split_name in ds else ds.to_pandas()
            print(f"   Loaded {len(df):,} rows, columns: {list(df.columns)}")
        except Exception as e:
            print(f"⚠️  Failed to load URL dataset: {e}")
            print("   Generating synthetic URL features from main training data...")
            df = _generate_synthetic_url_data()
    else:
        print("⚠️  URL dataset not found. Generating synthetic URL data...")
        df = _generate_synthetic_url_data()

    # ── Find URL and label columns ──────────────────────
    url_col = None
    label_col = None
    for c in df.columns:
        cl = c.lower()
        if "url" in cl and url_col is None:
            url_col = c
        elif ("label" in cl or "status" in cl or "type" in cl or "class" in cl) and label_col is None:
            label_col = c

    if url_col is None:
        # Fall back to first text column
        for c in df.columns:
            if df[c].dtype == object:
                url_col = c
                break

    if label_col is None:
        for c in df.columns:
            if c != url_col and df[c].dtype == object and df[c].nunique() < 10:
                label_col = c
                break

    print(f"   URL column: {url_col}, Label column: {label_col}")

    if url_col is None or label_col is None:
        print("❌ Could not identify URL and label columns. Using synthetic data.")
        df = _generate_synthetic_url_data()
        url_col = "url"
        label_col = "label"

    # ── Extract features ────────────────────────────────
    print("\n⚙️  Extracting URL features...")
    feature_rows = []
    for url in df[url_col].astype(str):
        feature_rows.append(extract_url_features(url))

    feature_df = pd.DataFrame(feature_rows)
    feature_names = list(feature_df.columns)
    X = feature_df.values

    # Labels
    lbl = df[label_col].astype(str).str.lower().str.strip()
    phishing_labels = {"phishing", "malicious", "bad", "1", "spam", "suspicious", "defacement", "malware"}
    y = lbl.isin(phishing_labels).astype(int)

    print(f"   Features: {len(feature_names)}")
    print(f"   Labels: phishing={y.sum():,}, legitimate={(~y.astype(bool)).sum():,}")

    # ── Scale and train ─────────────────────────────────
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n🚀 Training Logistic Regression on {X_train.shape[0]:,} samples...")
    model = LogisticRegression(C=1.0, max_iter=1000, class_weight="balanced")
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

    # ── Save ────────────────────────────────────────────
    artifact = {
        "model": model,
        "scaler": scaler,
        "feature_names": feature_names,
        "known_domains": KNOWN_DOMAINS,
        "suspicious_tlds": list(SUSPICIOUS_TLDS),
    }
    with open(output_path, "wb") as f:
        pickle.dump(artifact, f)
    print(f"\n✅ URL scorer saved to {output_path}")


def _generate_synthetic_url_data() -> pd.DataFrame:
    """Generate synthetic URL data for training when real dataset isn't available."""
    import random
    random.seed(42)

    urls = []
    labels = []

    # Legitimate URLs
    legit_domains = [
        "google.com", "microsoft.com", "apple.com", "amazon.com",
        "sbi.co.in", "hdfcbank.com", "rbi.org.in", "gov.in",
        "wikipedia.org", "github.com", "stackoverflow.com",
    ]
    for _ in range(2000):
        domain = random.choice(legit_domains)
        path = "/" + "/".join(random.choices(["page", "docs", "help", "about", "login"], k=random.randint(0, 3)))
        urls.append(f"https://{domain}{path}")
        labels.append("legitimate")

    # Phishing URLs
    phish_patterns = [
        "sbi-update.xyz", "hdfc-verify.top", "rbi-kyc.click",
        "secure-bank.ml", "update-account.ga", "verify-now.cf",
    ]
    for _ in range(2000):
        domain = random.choice(phish_patterns)
        path = "/" + random.choice(["verify", "login", "update", "secure", "confirm"])
        urls.append(f"http://{domain}{path}")
        labels.append("phishing")

    return pd.DataFrame({"url": urls, "label": labels})


if __name__ == "__main__":
    main()
