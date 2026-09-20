"""
Train brand/logo impersonation matcher using perceptual hashing.

Builds a phash index over brand logo PNGs. At inference time, embedded
images in emails are compared against this index.

Upgrade path: CLIP embedding similarity via openai/clip-vit-base-patch32.
"""
import os
import argparse
import pickle
import json
from pathlib import Path

import imagehash
from PIL import Image


def build_phash_index(logo_dir: str) -> dict:
    """
    Build a perceptual hash index from brand logo PNGs.
    
    Returns dict mapping brand_name -> {"phash": str, "path": str}
    """
    logo_path = Path(logo_dir)
    index = {}
    
    if not logo_path.exists():
        print(f"⚠️  Logo directory not found: {logo_dir}")
        return index
    
    for img_file in sorted(logo_path.glob("*.png")):
        try:
            img = Image.open(img_file)
            phash = imagehash.phash(img, hash_size=16)
            ahash = imagehash.average_hash(img, hash_size=16)
            dhash = imagehash.dhash(img, hash_size=16)
            
            brand_name = img_file.stem.replace("_", " ").replace("-", " ").title()
            index[brand_name] = {
                "phash": str(phash),
                "ahash": str(ahash),
                "dhash": str(dhash),
                "path": str(img_file),
            }
            print(f"   ✅ {brand_name}: phash={phash}")
        except Exception as e:
            print(f"   ⚠️  Failed to process {img_file.name}: {e}")
    
    return index


def compare_image_to_index(image_path: str, index: dict, threshold: int = 15) -> list:
    """
    Compare an image against the brand phash index.
    
    Returns list of matches: [{"brand": str, "distance": int, "similarity": float}]
    """
    try:
        img = Image.open(image_path)
        query_phash = imagehash.phash(img, hash_size=16)
    except Exception:
        return []
    
    matches = []
    for brand_name, brand_data in index.items():
        stored_phash = imagehash.hex_to_hash(brand_data["phash"])
        distance = query_phash - stored_phash
        
        # 256-bit hash, max distance = 256
        similarity = max(0, 1.0 - (distance / 256.0))
        
        if distance <= threshold:
            matches.append({
                "brand": brand_name,
                "distance": distance,
                "similarity": round(similarity * 100, 1),
            })
    
    matches.sort(key=lambda x: x["distance"])
    return matches


def main():
    parser = argparse.ArgumentParser(description="Build brand logo phash index")
    parser.add_argument("--logo-dir", default=None, help="Path to brand logo PNGs")
    parser.add_argument("--output-path", default=None, help="Output path for phash index")
    parser.add_argument("--use-clip", action="store_true", help="Use CLIP embeddings (stretch goal)")
    args = parser.parse_args()
    
    logo_dir = args.logo_dir or str(Path(__file__).parent.parent / "data" / "brand_logos")
    output_path = args.output_path or str(Path(__file__).parent.parent / "models" / "brand_phash_index.pkl")
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    print("🏦 Building Brand Logo Impersonation Index")
    print("=" * 50)
    
    if args.use_clip:
        print("⚠️  CLIP embeddings are a stretch goal — using phash for now.")
        print("   To enable: pip install transformers torch")
        print("   Model: openai/clip-vit-base-patch32")
    
    # Build index
    print(f"\n📂 Scanning logos in {logo_dir}...")
    index = build_phash_index(logo_dir)
    
    if not index:
        print("\n⚠️  No logos found. Creating empty index with placeholder brands.")
        print("   Add official logo PNGs to:", logo_dir)
        # Create placeholder index for the pipeline to work
        index = {
            "RBI": {"phash": "0" * 64, "ahash": "0" * 64, "dhash": "0" * 64, "path": "placeholder"},
            "SBI": {"phash": "0" * 64, "ahash": "0" * 64, "dhash": "0" * 64, "path": "placeholder"},
            "HDFC": {"phash": "0" * 64, "ahash": "0" * 64, "dhash": "0" * 64, "path": "placeholder"},
            "ICICI": {"phash": "0" * 64, "ahash": "0" * 64, "dhash": "0" * 64, "path": "placeholder"},
        }
    
    # Save
    artifact = {
        "index": index,
        "hash_size": 16,
        "threshold": 15,
        "method": "phash",
        "brand_count": len(index),
    }
    with open(output_path, "wb") as f:
        pickle.dump(artifact, f)
    
    print(f"\n✅ Brand phash index saved to {output_path}")
    print(f"   {len(index)} brands indexed")


if __name__ == "__main__":
    main()
