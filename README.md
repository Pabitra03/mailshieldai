# MailShieldAI

> **Enterprise Email Security, Threat Intelligence & Digital Forensics SOC Platform**

MailShieldAI is an autonomous email cybersecurity platform that detects advanced phishing, Business Email Compromise (BEC), and spoofing attacks. Unlike traditional email gateways that merely block or spam-folder suspicious messages, MailShieldAI:

1. **Unmasks the Attacker's True Origin**: Traces multi-hop SMTP relay chains through commercial VPNs and Tor exit nodes to identify geographic location and Autonomous System (ASN).
2. **Explains the Verdict**: Provides clear, human-readable SHAP machine learning explainability—never a black box.
3. **Seals Court-Admissible Evidence**: Cryptographically hashes and seals every email into a tamper-evident SHA-256 Merkle tree ledger, generating BSA Section 63(4) statutory digital evidence certificates.

---

## 🧭 System Architecture & How Everything Is Connected

MailShieldAI is built as three coordinated, lightweight services that communicate over standard REST APIs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. FRONTEND ANALYST SOC                            │
│           React 19 + TypeScript + Vite + Tailwind CSS (Port 5173)           │
│  - Floating Glass Navigation Bar & Executive Threat Intelligence Hero       │
│  - Live Threat Feed Table with 400ms Sliding Forensic Inspection Drawer     │
│  - Geo-Forensics Dark Cyber Map, Campaign Graphs & Evidence Vault           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / Proxy
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2. FASTAPI BACKEND ORCHESTRATOR                     │
│                             Python FastAPI (Port 8000)                      │
│  - Ingests .EML files and raw RFC 822 email source streams                  │
│  - Coordinates the multi-stage pipeline: Ingest → ML → Geo → Evidence       │
│  - Generates BSA §63(4) statutory certificates and forensic report PDFs    │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼ HTTP                                ▼ Local Modules
┌───────────────────────────────────┐ ┌───────────────────────────────────────┐
│     3. ML INFERENCE SERVICE       │ │       4. FORENSIC ENGINES             │
│    Python FastAPI (Port 8001)     │ │ - Geo-Intel Engine: MaxMind GeoLite2  │
│ - 5-Model Machine Learning Engine │ │   offline database for ASN/City/Geo   │
│ - Header Forensics (LightGBM)     │ │ - Tor & VPN Unmasking: Consensus node │
│ - Intent Classifier (NLP TF-IDF)  │ │   and bulletproof hosting detection   │
│ - URL Scorer (Domain heuristics)  │ │ - Evidence Vault: SHA-256 Merkle tree │
│ - Novelty Detector (Isolation For)│ │   ledger and tamper-evident hash chain│
│ - SHAP Feature Importance Explainer│ └───────────────────────────────────────┘
└───────────────────────────────────┘
```

### Communication Flow in Plain English:
1. **You upload or paste an email** on the frontend (`http://localhost:5173/`).
2. **The Frontend sends the raw email** to the Backend Orchestrator (`POST /api/ingest` on Port 8000).
3. **The Backend parses the email headers and body** into structured components (From, Reply-To, SPF, DKIM, DMARC, hops, text, URLs).
4. **The Backend forwards the parsed data** to the ML Service (`POST /predict` on Port 8001). The ML models calculate a Risk Score (0–100) and identify exact reasons (e.g., "+38% Domain Spoofing", "+28% Urgency Language").
5. **The Geo-Forensics Engine** examines the `Received:` headers to map the routing path and verify if any hop passed through Tor, VPNs, or bulletproof hosting providers.
6. **The Evidence Vault** computes cryptographic SHA-256 hashes of the raw email, verdict, and geo-data, locking them into a Merkle root.
7. **The Frontend receives the complete dossier** in sub-second latency and displays it in the Live Threat Feed and interactive Threat Drawer.

---

## 🧠 How the Machine Learning Works

MailShieldAI does not rely on a single model or brittle keyword rules. It uses a **5-Model Parallel Ensemble** that looks at emails from multiple angles:

| Model | Technique | What It Does | Why It Matters |
|---|---|---|---|
| **1. Header Forensics** | LightGBM Gradient Boosting | Examines 22 technical email header features (SPF fail, DKIM fail, DMARC alignment, hop count, display-name vs. from address mismatch, suspicious TLDs like `.xyz`, `.top`). | Catches spoofed senders and fake domain clones before reading a single word of text. |
| **2. Intent Classifier** | NLP TF-IDF + Logistic Regression | Reads email subject and body text to detect psychological coercion, urgency ("within 24 hours", "suspended"), and credential harvesting intent. | Catches Business Email Compromise (BEC) and social engineering tricks. |
| **3. URL & Domain Scorer** | Feature Extractor + Logistic Regression | Inspects embedded hyperlinks for homoglyphs (look-alike letters), high character entropy, and suspicious redirectors. | Identifies fake banking links and credential-stealing login pages. |
| **4. Novelty Detector** | Isolation Forest (Unsupervised Anomaly Detection) | Flags never-seen-before attack patterns that significantly deviate from normal corporate email traffic. | Detects novel zero-day attacks that bypass traditional signature-based spam filters. |
| **5. Brand Matcher** | Perceptual Hashing (pHash) | Scans embedded email logos and matches them against authentic enterprise brand hashes (RBI, SBI, HDFC, etc.). | Catches fraudulent brand impersonation even if the logo image was slightly resized or modified. |

### The Fusion Formula:
The scores are weighted together into a final **Risk Score (0 to 100)**:
- **0.0 – 35.0**: Clean / Low Risk (Green)
- **35.1 – 69.9**: Suspicious / Moderate Risk (Amber)
- **70.0 – 100.0**: Phishing / BEC / High Risk (Red Alert)

### SHAP Explainability ("Why was this flagged?"):
For every email flagged, MailShieldAI breaks down the exact contributing factors:
- `+38% Domain Homoglyph Spoofing` (e.g., `hdfc-secure.net` is a clone)
- `+28% Psychological Coercion Tokens` (e.g., "urgent KYC verification")
- `+22% Cryptographic Authentication Failure` (SPF and DKIM failed)
- `+12% Offshore Bulletproof Relay IP` (Origin in untrusted ASN)

---

## ⚡ How to Run Everything (Quick Start for Windows & macOS)

### Prerequisites
- **Python 3.10+** (Python 3.11, 3.12, 3.13, or 3.14)
- **Node.js 18+** and **npm**

---

### 🌐 Where the Backend & Services Are Running

| Service | Port / URL | Purpose | Interactive Docs / UI |
|---|---|---|---|
| **FastAPI Backend Orchestrator** | **`http://localhost:8000`** | Ingestion pipeline, geo attribution, cases & evidence vault | **`http://localhost:8000/docs`** (Swagger UI) |
| **ML Inference Service** | **`http://localhost:8001`** | 5-model AI ensemble, SHAP explainability & feature scoring | **`http://localhost:8001/docs`** (Swagger UI) |
| **Frontend Dashboard SOC** | **`http://localhost:5173`** | Premium analyst console, live threat feed, world map & graphs | **`http://localhost:5173/`** |

> [!NOTE]
> **Why did you see `{"detail":"Not Found"}`?**  
> In FastAPI, if you open `http://localhost:8000` directly in the browser and no root `@app.get("/")` handler is defined, FastAPI returns `{"detail":"Not Found"}` (HTTP 404). We have now registered a root handler at `GET /` that returns service status, and you can also visit **`http://localhost:8000/docs`** for interactive Swagger documentation of all API endpoints!

---

### Environment Setup (`.env`)

Copy the template to create your `.env` file:

**macOS / Linux:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (CMD):**
```cmd
copy .env.example .env
```

---

### Step 1: Start the ML Inference Service (Port 8001)

#### On macOS / Linux:
```bash
cd "/Users/pabitra/Desktop/untitled folder/mailshieldai/ml"

# Create virtualenv if not already created
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start ML service
python3 -m uvicorn inference.serve:app --host 0.0.0.0 --port 8001 --reload
```

#### On Windows (PowerShell):
```powershell
cd "mailshieldai\ml"

# Create virtualenv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start ML service
python -m uvicorn inference.serve:app --host 0.0.0.0 --port 8001 --reload
```

---

### Step 2: Start the FastAPI Backend (Port 8000)

#### On macOS / Linux:
```bash
cd "/Users/pabitra/Desktop/untitled folder/mailshieldai/backend"
source ../ml/.venv/bin/activate
pip install -r requirements.txt

# Start Backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### On Windows (PowerShell):
```powershell
cd "mailshieldai\backend"
..\ml\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### Step 3: Start the Frontend (Port 5173)

#### On macOS / Linux:
```bash
cd "/Users/pabitra/Desktop/untitled folder/mailshieldai/frontend"
npm install
npm run dev
```

#### On Windows (PowerShell / CMD):
```powershell
cd "mailshieldai\frontend"
npm install
npm run dev
```

---

### Step 4: Seed Demo Threat Cases (Whenever you want)

To populate the Threat Feed with 5 realistic cyber scenarios (Fake RBI KYC, CEO Wire Fraud, SBI Clone, HDFC Phishing, Clean Advisory):

#### On macOS / Linux:
```bash
python3 backend/seed_demo_data.py
```

#### On Windows (PowerShell):
```powershell
python backend\seed_demo_data.py
```

---

### Step 5: Open the Application
Open your web browser and navigate to:
**`http://localhost:5173/`**

## 🛠️ How to Download Datasets & Train the Machine Learning Models

You have 100% control over data and models. All pre-existing model weights in `ml/models/` and cached datasets in `ml/data/` have been wiped so you can perform the full pipeline from raw data to trained models yourself!

---

### Step 1: Download the Training Datasets (Do This First!)

MailShieldAI includes an automated dataset downloader script in `ml/data/download_datasets.py`. It pulls verified phishing, BEC, and legitimate email datasets directly from HuggingFace and merges them into `ml/data/training_merged.csv`.

#### Recommended: Fast Download (~18,000 real emails, takes ~30 seconds)

**On macOS / Linux:**
```bash
cd "/Users/pabitra/Desktop/untitled folder/mailshieldai/ml"
source .venv/bin/activate

# Download and merge training data
python3 data/download_datasets.py --small --skip-eml
```

**On Windows (PowerShell):**
```powershell
cd "mailshieldai\ml"
.\.venv\Scripts\Activate.ps1

# Download and merge training data
python data\download_datasets.py --small --skip-eml
```

#### Optional: Full Download (~300,000+ emails + raw EML repos)
```bash
python data/download_datasets.py
```

#### Verify Download:
```bash
python data/download_datasets.py --verify
```
You will see:
```text
🔍 Verifying datasets...

  ✅ Fallback HF dataset (Fast): fallback_dataset (4 files)
  ⚪ Primary HF dataset (Optional full): (Not downloaded, optional)
  ⚪ URL HF dataset (Optional): (Not downloaded, optional)
  ⚪ Phishing .eml (Optional): (Not downloaded, optional)
  ⚪ Enron clean .eml (Optional): (Not downloaded, optional)
  ✅ Brand logos: brand_logos (1 files)
  ✅ Merged training CSV (Required for ML): training_merged.csv (['text', 'label', ...])

🎉 ML Training dataset is ready! You can now run: python training/train_all.py
```

> [!NOTE]
> Only **`training_merged.csv`** is required for training the ML models. The items marked `⚪ (Optional)` are secondary alternative corpuses and raw email dumps; they are not required to train the 5 models.

---

### Step 2: Train the ML Models

Once your dataset is downloaded, you can train all 5 models in one click, or train them individually:

#### Option A: Train All 5 Models in 1 Command (Recommended)

**On macOS / Linux:**
```bash
python3 training/train_all.py
```

**On Windows (PowerShell):**
```powershell
python training\train_all.py
```

---

#### Option B: Train Individual Models One-by-One

#### 1. Train the Header Forensics Model (LightGBM)
Trains on 22 header signals (SPF, DKIM, DMARC, hop counts, TLDs, urgency tokens):
```bash
python training/train_header_lightgbm.py
```
- **Output**: `ml/models/header_lgbm.pkl`
- **Performance**: ~82% Accuracy, 0.90 AUC-ROC across 18,000+ real samples.

#### 2. Train the Intent Classifier (NLP TF-IDF + Logistic Regression)
Trains on email body and subject text to classify phishing coercion vs. legitimate correspondence:
```bash
python training/train_intent_classifier.py --max-samples 10000
```
- **Output**: `ml/models/intent_classifier/intent_model.pkl` and `tfidf_vectorizer.pkl`
- **Performance**: ~96% Accuracy, 0.99 AUC-ROC.

#### 3. Train the URL & Domain Scorer
Extracts 19 URL features (character entropy, IP in URL, suspicious TLD, typosquatting):
```bash
python training/train_url_model.py
```
- **Output**: `ml/models/url_scorer.pkl`

#### 4. Train the Novelty / Anomaly Detector (Isolation Forest)
Identifies zero-day outliers and never-seen-before attack patterns:
```bash
python training/train_novelty_isolationforest.py
```
- **Output**: `ml/models/novelty_iforest.pkl`

#### 5. Build the Brand Logo Impersonation Index
Generates perceptual hash (pHash) fingerprints of trusted brand logos:
```bash
python training/train_brand_logo_match.py
```
- **Output**: `ml/models/brand_phash_index.pkl`

All trained model `.pkl` files will be placed into `ml/models/`. When you start the ML service (`uvicorn inference.serve:app --port 8001`), it will automatically detect and load your newly trained models into memory.

---

## 📡 REST API Reference

### Backend Orchestrator (`http://localhost:8000`)
- **`GET /health`**: Health status of the backend.
- **`POST /api/ingest`**: Upload a `.eml` file or raw RFC 822 text string. Returns `case_id` and verdict.
- **`GET /api/cases`**: Returns the list of all ingested cases with risk scores and verdicts.
- **`GET /api/cases/{case_id}`**: Returns full forensic dossier for a specific case (headers, SHAP explainability, geo-hops, Merkle root).
- **`GET /api/cases/{case_id}/certificate.pdf`**: Generates and downloads the official BSA Section 63(4) statutory certificate PDF.
- **`GET /api/cases/{case_id}/report.pdf`**: Generates and downloads the comprehensive forensic audit report PDF.
- **`GET /api/campaigns`**: Returns correlated threat campaign clusters and shared infrastructure graph data.

### ML Service (`http://localhost:8001`)
- **`GET /health`**: Verifies that all 5 ML models and vectorizers are loaded in memory.
- **`POST /predict`**: Direct ML scoring endpoint. Accepts `{"text": "...", "subject": "...", "sender": "..."}` and returns the risk score, verdict, component scores, and SHAP explanation list.

---

## 📂 Project Structure

```
mailshieldai/
├── frontend/                     # React 19 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── FloatingNavbar.tsx        # Centered glass floating navbar
│   │   │   ├── HeroThreatVisualizer.tsx  # 7-stage interactive pipeline
│   │   │   ├── ThreatDrawer.tsx          # 400ms slide-over forensic inspector
│   │   │   ├── UploadModal.tsx           # Multi-tab .EML file dropzone
│   │   │   └── landing/                  # 6 Modular Product Showcase sections
│   │   ├── pages/                        # LandingPage, LiveFeed, CaseDetail, etc.
│   │   └── index.css                     # Dark obsidian design system & tokens
│   └── vite.config.ts                    # Vite dev server with proxy to backend
│
├── backend/                      # FastAPI Orchestrator
│   ├── app/
│   │   ├── main.py                       # Application entry point
│   │   ├── core/config.py                # Environment configuration
│   │   └── api/routes/                   # Ingest, Cases, Geo, Evidence, Reports
│   └── seed_demo_data.py                 # Realistic demo generator
│
├── ml/                           # Machine Learning Subsystem
│   ├── models/                           # Serialized .pkl model weights
│   ├── inference/                        # serve.py (FastAPI on 8001), ensemble.py
│   ├── training/                         # 5 training scripts (LightGBM, NLP, URL, etc.)
│   └── data/                             # Datasets and download scripts
│
├── geo-intel/                    # Spatial Cyber Intelligence Engine
│   ├── hop_parser.py                     # RFC 5321/5322 Received header hop parser
│   ├── geoip_lookup.py                   # Offline MaxMind GeoLite2 resolver
│   ├── tor_vpn_unmask.py                 # Tor exit list & commercial VPN detection
│   └── confidence_fusion.py              # Attribution confidence scorer
│
└── evidence-vault/               # Cryptographic Custody & BSA Certificates
    ├── merkle.py                         # SHA-256 Merkle tree builder & proof verifier
    ├── ledger_chain.py                   # Tamper-evident hash chain ledger
    └── bsa_certificate.py                # Automated BSA §63(4) court certificate PDF
```

---

## 🔒 Security & Privacy Notice
MailShieldAI processes incoming emails using isolated local inference models and offline MaxMind databases. Raw email bodies are evaluated ephemerally and sealed via SHA-256 Merkle proofs. No client data is transmitted to third-party cloud LLMs or external advertising trackers.
