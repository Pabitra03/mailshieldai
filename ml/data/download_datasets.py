"""
Dataset downloader for MailShieldAI training data.

Downloads:
1. locuoco/the-biggest-spam-ham-phish-email-dataset-300000 (HuggingFace, ~300k rows)
2. zefang-liu/phishing-email-dataset (HuggingFace, ~18k rows, fallback)
3. ealvaradob/phishing-dataset (HuggingFace, URL subset)
4. rf-peixoto/phishing_pot (GitHub, raw .eml with headers)

Usage:
    python download_datasets.py [--verify] [--small] [--skip-eml]
"""
import os
import sys
import json
import argparse
import subprocess
from pathlib import Path

# Resolve paths relative to this script
DATA_DIR = Path(__file__).parent.resolve()
RAW_EML_DIR = DATA_DIR / "raw_eml"
BRAND_LOGOS_DIR = DATA_DIR / "brand_logos"
MERGED_CSV = DATA_DIR / "training_merged.csv"


def download_hf_datasets(small_only: bool = False):
    """Download HuggingFace datasets and save as CSV/parquet."""
    try:
        from datasets import load_dataset
    except ImportError:
        print("❌ `datasets` package not installed. Run: pip install datasets")
        sys.exit(1)

    # ── Dataset 1: Primary training set (~300k rows) ────
    if not small_only:
        primary_path = DATA_DIR / "primary_dataset"
        if primary_path.exists() and any(primary_path.iterdir()):
            print("✅ Primary dataset already downloaded, skipping.")
        else:
            print("📥 Downloading primary dataset (locuoco/the-biggest-spam-ham-phish-email-dataset-300000)...")
            print("   This is ~300k rows and may take a few minutes...")
            try:
                ds = load_dataset(
                    "locuoco/the-biggest-spam-ham-phish-email-dataset-300000",
                    trust_remote_code=True,
                )
                primary_path.mkdir(parents=True, exist_ok=True)
                # Save to disk for reuse
                ds.save_to_disk(str(primary_path))
                print(f"✅ Primary dataset saved to {primary_path}")
                # Print summary
                for split_name, split_ds in ds.items():
                    print(f"   {split_name}: {len(split_ds)} rows, columns: {split_ds.column_names}")
            except Exception as e:
                print(f"⚠️  Failed to download primary dataset: {e}")
                print("   Will fall back to smaller dataset.")

    # ── Dataset 2: Small fallback (~18k rows) ───────────
    fallback_path = DATA_DIR / "fallback_dataset"
    if fallback_path.exists() and any(fallback_path.iterdir()):
        print("✅ Fallback dataset already downloaded, skipping.")
    else:
        print("📥 Downloading fallback dataset (zefang-liu/phishing-email-dataset)...")
        try:
            ds = load_dataset("zefang-liu/phishing-email-dataset", trust_remote_code=True)
            fallback_path.mkdir(parents=True, exist_ok=True)
            ds.save_to_disk(str(fallback_path))
            print(f"✅ Fallback dataset saved to {fallback_path}")
            for split_name, split_ds in ds.items():
                print(f"   {split_name}: {len(split_ds)} rows, columns: {split_ds.column_names}")
        except Exception as e:
            print(f"⚠️  Failed to download fallback dataset: {e}")

    # ── Dataset 3: URL/domain features ──────────────────
    url_path = DATA_DIR / "url_dataset"
    if url_path.exists() and any(url_path.iterdir()):
        print("✅ URL dataset already downloaded, skipping.")
    else:
        print("📥 Downloading URL dataset (ealvaradob/phishing-dataset)...")
        try:
            ds = load_dataset("ealvaradob/phishing-dataset", "combined", trust_remote_code=True)
            url_path.mkdir(parents=True, exist_ok=True)
            ds.save_to_disk(str(url_path))
            print(f"✅ URL dataset saved to {url_path}")
            for split_name, split_ds in ds.items():
                print(f"   {split_name}: {len(split_ds)} rows, columns: {split_ds.column_names}")
        except Exception as e:
            print(f"⚠️  Failed to download URL dataset: {e}")
            # Try without config name
            try:
                ds = load_dataset("ealvaradob/phishing-dataset", trust_remote_code=True)
                url_path.mkdir(parents=True, exist_ok=True)
                ds.save_to_disk(str(url_path))
                print(f"✅ URL dataset saved to {url_path} (default config)")
            except Exception as e2:
                print(f"⚠️  Also failed with default config: {e2}")


def download_raw_eml(skip: bool = False):
    """Clone raw .eml repositories for geo-forensics hop-chain demo."""
    if skip:
        print("⏭️  Skipping raw .eml download (--skip-eml)")
        return

    RAW_EML_DIR.mkdir(parents=True, exist_ok=True)

    # ── Dataset 4: Phishing honeypot .eml files ─────────
    phishing_pot_dir = RAW_EML_DIR / "phishing_pot"
    if phishing_pot_dir.exists() and any(phishing_pot_dir.iterdir()):
        print("✅ phishing_pot already cloned, skipping.")
    else:
        print("📥 Cloning rf-peixoto/phishing_pot (raw .eml with intact headers)...")
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1",
                 "https://github.com/rf-peixoto/phishing_pot.git",
                 str(phishing_pot_dir)],
                check=True,
                capture_output=True,
                text=True,
            )
            # Count .eml files
            eml_count = sum(1 for _ in phishing_pot_dir.rglob("*.eml"))
            txt_count = sum(1 for _ in phishing_pot_dir.rglob("*.txt"))
            print(f"✅ phishing_pot cloned: {eml_count} .eml files, {txt_count} .txt files")
        except subprocess.CalledProcessError as e:
            print(f"⚠️  Failed to clone phishing_pot: {e.stderr}")
        except FileNotFoundError:
            print("⚠️  git not found. Install git and retry, or manually clone:")
            print(f"   git clone https://github.com/rf-peixoto/phishing_pot.git {phishing_pot_dir}")

    # ── Dataset 5: Enron clean emails ───────────────────
    enron_dir = RAW_EML_DIR / "enron_clean"
    enron_dir.mkdir(parents=True, exist_ok=True)
    if any(enron_dir.iterdir()):
        print("✅ Enron clean emails already present, skipping.")
    else:
        print("ℹ️  Enron raw email archive needs manual placement:")
        print(f"   Download from Kaggle (wcukierski/enron-email-dataset)")
        print(f"   Place .eml or raw email files into: {enron_dir}")
        # Create a README placeholder
        (enron_dir / "README.md").write_text(
            "# Enron Clean Emails\n\n"
            "Place raw .eml files here from the Enron email archive.\n\n"
            "Source: https://www.kaggle.com/datasets/wcukierski/enron-email-dataset\n"
        )


def setup_brand_logos():
    """Create brand logos directory with placeholder info."""
    BRAND_LOGOS_DIR.mkdir(parents=True, exist_ok=True)
    if any(f for f in BRAND_LOGOS_DIR.iterdir() if f.suffix == ".png"):
        print("✅ Brand logos already present.")
        return

    print("ℹ️  Brand logos directory created. Add official logo PNGs for:")
    brands = [
        "RBI (Reserve Bank of India)",
        "SBI (State Bank of India)",
        "HDFC Bank",
        "ICICI Bank",
        "UIDAI (Aadhaar)",
        "Income Tax Department",
        "PNB (Punjab National Bank)",
        "Bank of Baroda",
        "Canara Bank",
        "India Post",
        "Paytm",
        "PhonePe",
        "Google Pay",
    ]
    for b in brands:
        print(f"   • {b}")

    # Write a manifest
    manifest = {"brands": brands, "format": "PNG", "recommended_size": "256x256"}
    (BRAND_LOGOS_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"   Manifest written to {BRAND_LOGOS_DIR / 'manifest.json'}")


def merge_training_data():
    """Merge downloaded datasets into a single training CSV."""
    try:
        import pandas as pd
        from datasets import load_from_disk
    except ImportError:
        print("❌ pandas or datasets not installed")
        return

    if MERGED_CSV.exists():
        print(f"✅ Merged training CSV already exists: {MERGED_CSV}")
        existing = pd.read_csv(MERGED_CSV, nrows=5)
        print(f"   Columns: {list(existing.columns)}")
        return

    print("🔄 Merging datasets into unified training table...")
    all_rows = []

    # ── Load primary dataset ────────────────────────────
    primary_path = DATA_DIR / "primary_dataset"
    if primary_path.exists():
        try:
            ds = load_from_disk(str(primary_path))
            for split_name in ds:
                split = ds[split_name]
                df = split.to_pandas()
                # Normalize column names (check label/type FIRST before email/text)
                col_map = {}
                for c in df.columns:
                    cl = c.lower()
                    if "label" in cl or "class" in cl or "type" in cl or "category" in cl:
                        col_map[c] = "label"
                    elif "subject" in cl:
                        col_map[c] = "subject"
                    elif "text" in cl or "body" in cl or "content" in cl or "message" in cl or "email" in cl:
                        col_map[c] = "text"

                df = df.rename(columns=col_map)
                if "text" in df.columns and "label" in df.columns:
                    subset = df[["text", "label"]].copy()
                    subset["source"] = "primary"
                    subset["has_headers"] = False
                    all_rows.append(subset)
                    print(f"   ✅ Primary/{split_name}: {len(subset)} rows")
                else:
                    # Fallback auto-mapping
                    text_col = None
                    label_col = None
                    for c in df.columns:
                        if df[c].dtype == object and text_col is None and df[c].str.len().mean() > 50:
                            text_col = c
                        if df[c].dtype == object and label_col is None and c != text_col and df[c].nunique() < 10:
                            label_col = c
                    if text_col and label_col:
                        subset = df[[text_col, label_col]].copy()
                        subset.columns = ["text", "label"]
                        subset["source"] = "primary"
                        subset["has_headers"] = False
                        all_rows.append(subset)
                        print(f"   ✅ Primary/{split_name} (auto-mapped {text_col}->{label_col}): {len(subset)} rows")
        except Exception as e:
            print(f"   ⚠️  Failed to load primary dataset: {e}")

    # ── Load fallback dataset ───────────────────────────
    fallback_path = DATA_DIR / "fallback_dataset"
    if fallback_path.exists():
        try:
            ds = load_from_disk(str(fallback_path))
            for split_name in ds:
                split = ds[split_name]
                df = split.to_pandas()
                col_map = {}
                for c in df.columns:
                    cl = c.lower()
                    # Check label/type FIRST so 'Email Type' becomes 'label', not 'text'
                    if "label" in cl or "class" in cl or "type" in cl or "category" in cl:
                        col_map[c] = "label"
                    elif "subject" in cl:
                        col_map[c] = "subject"
                    elif "text" in cl or "body" in cl or "content" in cl or "message" in cl or "email" in cl:
                        col_map[c] = "text"

                df = df.rename(columns=col_map)
                if "text" in df.columns and "label" in df.columns:
                    subset = df[["text", "label"]].copy()
                    subset["source"] = "fallback"
                    subset["has_headers"] = False
                    all_rows.append(subset)
                    print(f"   ✅ Fallback/{split_name}: {len(subset)} rows")
                else:
                    print(f"   ⚠️  Fallback/{split_name}: columns {list(df.columns)}")
        except Exception as e:
            print(f"   ⚠️  Failed to load fallback dataset: {e}")

    # ── Merge and save ──────────────────────────────────
    if all_rows:
        merged = pd.concat(all_rows, ignore_index=True)
        # Normalize labels
        label_map = {}
        for lbl in merged["label"].unique():
            lbl_lower = str(lbl).lower().strip()
            if any(k in lbl_lower for k in ["phish", "spam", "malicious", "fraud", "scam", "1"]):
                label_map[lbl] = "phishing"
            elif any(k in lbl_lower for k in ["safe", "ham", "legit", "benign", "clean", "0"]):
                label_map[lbl] = "legitimate"
            else:
                label_map[lbl] = lbl_lower

        merged["label_normalized"] = merged["label"].map(label_map)

        # Drop rows with empty text
        merged = merged.dropna(subset=["text"])
        merged = merged[merged["text"].str.strip().str.len() > 10]

        # Save
        merged.to_csv(str(MERGED_CSV), index=False)
        print(f"\n✅ Merged training CSV saved: {MERGED_CSV}")
        print(f"   Total rows: {len(merged):,}")
        print(f"   Label distribution:")
        for lbl, count in merged["label_normalized"].value_counts().items():
            print(f"     {lbl}: {count:,}")
        print(f"   Sources: {merged['source'].value_counts().to_dict()}")
    else:
        print("⚠️  No datasets loaded — cannot create merged CSV.")
        print("   Download datasets first, then re-run with --merge-only")


def verify_datasets():
    """Verify datasets are downloaded and ready for training."""
    print("\n🔍 Verifying datasets...\n")

    checks = [
        ("Fallback HF dataset (Fast)", DATA_DIR / "fallback_dataset", False),
        ("Primary HF dataset (Optional full)", DATA_DIR / "primary_dataset", False),
        ("URL HF dataset (Optional)", DATA_DIR / "url_dataset", False),
        ("Phishing .eml (Optional)", RAW_EML_DIR / "phishing_pot", False),
        ("Enron clean .eml (Optional)", RAW_EML_DIR / "enron_clean", False),
        ("Brand logos", BRAND_LOGOS_DIR, True),
        ("Merged training CSV (Required for ML)", MERGED_CSV, True),
    ]

    essential_ok = True
    for name, path, required in checks:
        if path.exists() and (path.is_file() or any(path.iterdir())):
            if path.is_file():
                import pandas as pd
                try:
                    df = pd.read_csv(str(path), nrows=1)
                    print(f"  ✅ {name}: {path.name} ({list(df.columns)})")
                except Exception:
                    print(f"  ✅ {name}: {path.name}")
            else:
                file_count = sum(1 for _ in path.rglob("*") if _.is_file())
                print(f"  ✅ {name}: {path.name} ({file_count} files)")
        else:
            status_icon = "❌" if required else "⚪"
            note = "(MISSING - Required for ML)" if required else "(Not downloaded, optional)"
            print(f"  {status_icon} {name}: {note}")
            if required:
                essential_ok = False

    if MERGED_CSV.exists() and MERGED_CSV.stat().st_size > 1000:
        print("\n🎉 ML Training dataset is ready! You can now run: python training/train_all.py")
        return True
    else:
        print("\n⚠️  Merged training CSV is missing. Run: python data/download_datasets.py --small --skip-eml")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Download and prepare MailShieldAI training datasets"
    )
    parser.add_argument("--verify", action="store_true", help="Verify downloaded datasets")
    parser.add_argument("--small", action="store_true", help="Download only the small fallback dataset")
    parser.add_argument("--skip-eml", action="store_true", help="Skip raw .eml downloads")
    parser.add_argument("--merge-only", action="store_true", help="Only merge existing datasets")
    args = parser.parse_args()

    if args.verify:
        verify_datasets()
        return

    if args.merge_only:
        merge_training_data()
        return

    print("=" * 60)
    print("📥 MailShieldAI Dataset Downloader")
    print("=" * 60)
    print()

    # Step 1: HuggingFace datasets
    download_hf_datasets(small_only=args.small)
    print()

    # Step 2: Raw .eml files
    download_raw_eml(skip=args.skip_eml)
    print()

    # Step 3: Brand logos setup
    setup_brand_logos()
    print()

    # Step 4: Merge into training CSV
    merge_training_data()
    print()

    # Step 5: Verify
    verify_datasets()


if __name__ == "__main__":
    main()
