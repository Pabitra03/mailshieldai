"""
Train Isolation Forest novelty / campaign outlier detector.

Fits over the fused feature vector from all scoring models to flag
never-seen-before patterns. The novelty flag triggers heightened
human review rather than an automatic verdict change.
"""
import argparse
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


def main():
    parser = argparse.ArgumentParser(description="Train Isolation Forest novelty detector")
    parser.add_argument("--data-path", default=None, help="Path to training CSV")
    parser.add_argument("--output-path", default=None, help="Model output path")
    parser.add_argument("--contamination", type=float, default=0.05, help="Expected anomaly fraction")
    args = parser.parse_args()

    data_path = args.data_path or str(Path(__file__).parent.parent / "data" / "training_merged.csv")
    output_path = args.output_path or str(Path(__file__).parent.parent / "models" / "novelty_iforest.pkl")

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    print("🔍 Training Isolation Forest Novelty Detector")
    print("=" * 50)

    # Import the header feature extractor
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from train_header_lightgbm import extract_header_features

    # ── Load data ───────────────────────────────────────
    print(f"\n📂 Loading data from {data_path}...")
    df = pd.read_csv(data_path)

    # Subsample for speed
    if len(df) > 30000:
        df = df.sample(n=30000, random_state=42)
        print(f"   Subsampled to 30,000 rows")

    # Extract features (same as header model)
    print("⚙️  Extracting features...")
    feature_rows = []
    for _, row in df.iterrows():
        features = extract_header_features(row.to_dict())
        feature_rows.append(features)

    feature_df = pd.DataFrame(feature_rows)
    X = feature_df.values

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ── Train Isolation Forest ──────────────────────────
    print(f"\n🚀 Training Isolation Forest (contamination={args.contamination})...")
    model = IsolationForest(
        n_estimators=200,
        contamination=args.contamination,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    # Evaluate on training data
    predictions = model.predict(X_scaled)
    anomaly_count = (predictions == -1).sum()
    print(f"\n📊 Results on training data:")
    print(f"   Total samples: {len(predictions):,}")
    print(f"   Anomalies detected: {anomaly_count:,} ({anomaly_count/len(predictions)*100:.1f}%)")
    print(f"   Normal: {(predictions == 1).sum():,}")

    # ── Save ────────────────────────────────────────────
    artifact = {
        "model": model,
        "scaler": scaler,
        "feature_names": list(feature_df.columns),
        "contamination": args.contamination,
    }
    with open(output_path, "wb") as f:
        pickle.dump(artifact, f)
    print(f"\n✅ Isolation Forest saved to {output_path}")


if __name__ == "__main__":
    main()
