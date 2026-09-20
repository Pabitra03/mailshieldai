"""
Train all MailShieldAI machine learning models sequentially.

Usage:
    python training/train_all.py
"""
import sys
import subprocess
from pathlib import Path

TRAINING_DIR = Path(__file__).parent

SCRIPTS = [
    ("1. Header LightGBM Gradient Boosting", "train_header_lightgbm.py", []),
    ("2. NLP Intent Classifier (TF-IDF)", "train_intent_classifier.py", ["--max-samples", "10000"]),
    ("3. URL & Domain Typo/Entropy Scorer", "train_url_model.py", []),
    ("4. Novelty Isolation Forest (Anomaly Detector)", "train_novelty_isolationforest.py", []),
    ("5. Brand Perceptual Hash (pHash) Fingerprinter", "train_brand_logo_match.py", []),
]

def main():
    print("=" * 65)
    print("🧠 MailShieldAI Model Training Pipeline")
    print("=" * 65)
    
    python_exe = sys.executable
    merged_csv = TRAINING_DIR.parent / "data" / "training_merged.csv"

    # Check if training dataset exists; if not, download it automatically
    if not merged_csv.exists():
        print("\n📥 Training dataset not found in ml/data/.")
        print("   Automatically downloading dataset (data/download_datasets.py --small --skip-eml)...")
        downloader = TRAINING_DIR.parent / "data" / "download_datasets.py"
        dl_res = subprocess.run([python_exe, str(downloader), "--small", "--skip-eml"], cwd=str(TRAINING_DIR.parent))
        if dl_res.returncode != 0:
            print("❌ Dataset download failed. Please run manually: python data/download_datasets.py --small --skip-eml")
            sys.exit(1)
        print("✅ Dataset successfully downloaded and prepared!")

    success_count = 0

    for idx, (name, script, args) in enumerate(SCRIPTS, 1):
        script_path = TRAINING_DIR / script
        print(f"\n[{idx}/5] Training {name}...")
        print(f"       Running: {script} {' '.join(args)}")
        
        cmd = [python_exe, str(script_path)] + args
        res = subprocess.run(cmd, cwd=str(TRAINING_DIR.parent))
        
        if res.returncode == 0:
            print(f"✅ Successfully trained: {name}")
            success_count += 1
        else:
            print(f"⚠️ Failed to train: {name} (exit code {res.returncode})")

    print("\n" + "=" * 65)
    print(f"🎉 Completed training: {success_count}/{len(SCRIPTS)} models trained.")
    print("   Models saved in: ml/models/")
    print("   You can now launch the ML inference service: uvicorn inference.serve:app --port 8001")
    print("=" * 65)

if __name__ == "__main__":
    main()
