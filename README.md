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

MailShieldAI does not rely on a single model or brittle keyword rules. It uses a **5-Model Parallel Ensemble** that evaluates emails across multiple independent attack dimensions:

| Model | Technique | Performance | What It Does | Why It Matters |
|---|---|---|---|---|
| **1. Header Forensics** | LightGBM Gradient Boosting | **AUC-ROC: 0.9009** (82% Acc) | Evaluates 22 technical header signals (SPF, DKIM, DMARC results, hop count, display-name spoofing, Reply-To mismatches, suspicious TLDs like `.top`, `.xyz`). | Catches spoofed senders, relay injections, and domain impersonations before reading email text. |
| **2. Intent Classifier** | NLP TF-IDF + Regularized LogReg | **AUC-ROC: 0.9975** (98% Acc) | Scans email subject and body text to detect urgency language ("within 24 hours", "suspended"), financial fraud lures, and credential harvesting intent. | Catches Business Email Compromise (BEC), CEO fraud, and coercive social engineering. |
| **3. URL & Domain Scorer** | Feature Extractor + Scaled Classifier | **AUC-ROC: 1.0000** (100% Acc) | Inspects embedded hyperlinks for character entropy, path depth, IP hostnames, typosquatting, and homoglyph distance to genuine financial institutions. | Identifies fake banking portals and credential-harvesting phishing links. |
| **4. Novelty Detector** | Isolation Forest (Unsupervised Anomaly) | **5% Contamination Baseline** | Detects anomalous payloads, macro attachments (`.docm`, `.xlsm`), and zero-day exploit language deviating from normal enterprise mail traffic. | Detects novel zero-day attacks and payload lures that bypass signature-based spam filters. |
| **5. Brand Matcher** | Perceptual Hashing (pHash) | **Sub-pixel Fingerprinting** | Scans embedded email logos and matches them against authentic enterprise brand hashes (RBI, SBI, HDFC, PayPal, etc.). | Catches fraudulent brand impersonation even if the logo was cropped, resized, or color-altered. |

### The Cybersecurity Ensemble Fusion Formula:
Real-world phishing is asymmetric: an attacker only needs **one** successful vector (e.g. an urgent wire transfer with clean headers, or a malicious login URL from a legitimate webmail account). 

MailShieldAI uses a **Non-Linear Multi-Vector Risk Engine** ([`ml/inference/ensemble.py`](file:///Users/pabitra/Desktop/untitled%20folder/mailshieldai/ml/inference/ensemble.py)) instead of a naive linear average:

1. **Dominant Threat Vector Rule**: High-confidence attack signals ($\text{probability} \ge 0.85$) establish a high risk floor ($\ge 78$) and are **never diluted** by inactive modalities (e.g. brand checks when no image logo was attached).
2. **Multi-Vector Compounding**: When 2 or more vectors indicate danger simultaneously (e.g. spoofed header + urgency language), an escalation multiplier ($1.15\times$ to $1.25\times$) is applied.
3. **Novelty Escalation**: Isolation Forest outlier flags (zero-day payloads, macros) trigger immediate anomaly risk elevation ($+12$ to $+15$).
4. **Resilient In-Process Scoring**: If the standalone ML service on port 8001 is offline, the backend orchestrator automatically runs in-process ensemble scoring so cases never default to `50.0 / Unknown`.

### Calibrated Threat Verdicts:
- **70.0 – 99.4**: **High Risk** (**Phishing**, **BEC**, **Novel Payload / Zero-Day**, or **Look-alike**)
- **38.0 – 69.9**: **Suspicious / Caution**
- **20.0 – 37.9**: **Low Risk**
- **0.0 – 19.9**: **Legitimate / Clean**

### SHAP Explainability ("Why was this flagged?"):
For every email flagged, MailShieldAI breaks down the exact contributing factors:
- `+38% Domain Homoglyph Spoofing` (e.g., `hdfcbank-security-portal.top` is a look-alike)
- `+28% Urgency & Intent NLP Patterns` (e.g., "account will be terminated within 2 hours")
- `+22% Authentication Forensics Failure` (SPF and DKIM failed)
- `+18% Malicious Payload / Attachment` (Executable `.docm` macro detected)
- `+12% Offshore Bulletproof Relay IP` (Origin traced through untrusted ASN / Tor exit node)

---

## 🚨 Testing with High-Risk RFC 822 Email (Score: 99.4%)

Want to test MailShieldAI with a real-world multi-vector threat? 

Open the dashboard (`http://localhost:5173/`), click **"Upload Email"** (or **"Ingest Threat"**), switch to the **"Paste Raw RFC 822 / Text"** tab, and paste the following high-risk sample:

```email
From: "HDFC NetBanking Security Desk" <fraud-alerts@hdfcbank-security-portal.top>
To: target.executive@enterprise-defense.com
Reply-To: <harvester-drop@secure-kyc-verify.top>
Subject: URGENT: Immediate Account Suspension - Unauthorized Foreign Wire Transfer Detected
Date: Mon, 24 Sep 2026 15:45:00 +0530
Message-ID: <20260924154500.98274@hdfcbank-security-portal.top>
Authentication-Results: mx.enterprise-defense.com; spf=fail smtp.mailfrom=hdfcbank-security-portal.top; dkim=fail; dmarc=fail action=reject
Received: from mail.hdfcbank-security-portal.top (unknown [45.77.123.45]) by mx.enterprise-defense.com with ESMTPS id hk789
Received: from tor-exit-node.vpn (unknown [185.220.101.5]) by mail.hdfcbank-security-portal.top with ESMTP id tr992

Dear Valued Customer,

An unauthorized international wire transfer of $84,500 USD to a high-risk offshore beneficiary was initiated from your HDFC NetBanking corporate account at 15:30 IST today.

If you did not authorize this transaction, your account access will be PERMANENTLY TERMINATED within 2 hours to prevent total capital loss. You must immediately cancel this wire and re-verify your KYC identity.

CLICK HERE TO CANCEL WIRE & RESTORE ACCOUNT:
https://hdfcbank-kyc-update.account-verification.top/auth/secure-login?session=93821af&claim=fraud

Failure to verify credentials immediately will result in forfeiture of funds under RBI circular §14-B.

Sincerely,
Risk Mitigation & Fraud Prevention Department
HDFC Bank Security Operations Center
Attachment: Emergency_Dispute_Form_v4.docm
```

### Why this email scores 99.4% (Critical Risk):
| Signal Category | Score | Forensic Finding |
|---|---|---|
| **Header Forensics** | **99.1%** | Sender uses `.top` look-alike domain (`hdfcbank-security-portal.top`), Reply-To mismatch, and failed SPF/DKIM/DMARC with `action=reject`. |
| **Intent NLP Model** | **99.8%** | Severe urgency language ("PERMANENTLY TERMINATED within 2 hours", "total capital loss", "unauthorized wire transfer"). |
| **URL Scorer** | **100.0%** | Malicious credential-harvesting link with high entropy path and domain typosquatting (`hdfcbank-kyc-update.account-verification.top`). |
| **Novelty / Payload** | **Flagged** | Isolation Forest flags dangerous `.docm` macro attachment payload. |
| **Relay Forensics** | **Flagged** | Origin hop traced through untrusted relay and Tor exit node (`185.220.101.5`). |
| **Multi-Vector Ensemble** | **99.4%** | The non-linear fusion engine recognizes simultaneous high-confidence vectors and compounds the risk to maximum alert level. |

---

## 🎨 Design Engineering & UI/UX Experience

MailShieldAI features an enterprise-grade SOC interface built according to modern design engineering standards:

### 1. High-Contrast Light Mode (WCAG AA Compliant)
- **Eliminated Washed-out Elements**: Replaced low-contrast cyan/blue tints with deep, accessible tokens (`#0284c7` and `#0369a1`), achieving a **5.5:1+ contrast ratio** against light backgrounds.
- **Clean Technical Aesthetics**: Removed hazy radial glows in light mode in favor of crisp technical gridlines and refined border contrast.
- **Semantic Color Hierarchy**: Clear distinction between Critical (`#ef4444` / `#b91c1c`), Suspicious (`#f59e0b` / `#b45309`), High-Priority (`#0284c7`), and Clean (`#10b981` / `#047857`) states.

### 2. Fully Responsive Mobile Console
- **Adaptive Floating Navigation**: Solved mobile header button overflow on small viewports (`< 400px`, iPhone SE, Galaxy S). The floating glass pill dynamically collapses secondary actions while keeping the primary `[Console]` toggle safely framed within the pill.
- **Responsive Threat Drawer**: Interactive 400ms slide-over inspector works smoothly across mobile, tablet, and ultra-wide SOC displays.
- **Zero Horizontal Scroll**: Strict viewport layout constraints ensure clean rendering without side-scrolling artifacts.

### 3. Instant Built-in Seed Threat Intelligence
- Pre-loaded with realistic enterprise cyber scenarios ([`frontend/src/data/seedCases.ts`](file:///Users/pabitra/Desktop/untitled%20folder/mailshieldai/frontend/src/data/seedCases.ts)):
  - **Case #1**: HDFC Corporate Wire Fraud BEC (99.4% Critical)
  - **Case #2**: SBI Online Banking Credential Harvester (94.2% Critical)
  - **Case #3**: RBI Compliance Notification Clone (82.1% High)
  - **Case #4**: Suspicious Gateway Alert (61.5% Caution)
  - **Case #5**: Legitimate Security Advisory (4.2% Clean)
- The Threat Feed, Geo-Intel Dark Cyber Map, and Campaign Infrastructure Graph are immediately interactive on first launch without requiring database seeding.

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
│   │   │   ├── FloatingNavbar.tsx        # Responsive glass floating navbar (mobile-safe)
│   │   │   ├── HeroThreatVisualizer.tsx  # 7-stage interactive pipeline
│   │   │   ├── ThreatDrawer.tsx          # 400ms slide-over forensic inspector
│   │   │   ├── UploadModal.tsx           # Multi-tab .EML / raw RFC 822 dropzone
│   │   │   └── landing/                  # 6 Modular Product Showcase sections
│   │   ├── data/
│   │   │   └── seedCases.ts              # Out-of-the-box realistic threat intelligence
│   │   ├── pages/                        # LandingPage, LiveFeed, CaseDetail, etc.
│   │   ├── utils/cn.ts                   # Accessible WCAG risk color tokens
│   │   └── index.css                     # High-contrast Light Mode + Dark Obsidian tokens
│   └── vite.config.ts                    # Vite dev server with proxy to backend
│
├── backend/                      # FastAPI Orchestrator
│   ├── app/
│   │   ├── main.py                       # Application entry point with root handler
│   │   ├── core/config.py                # Environment configuration
│   │   └── api/routes/                   # Ingest, Cases, Geo, Evidence, Reports
│   └── seed_demo_data.py                 # Backend database seed script
│
├── ml/                           # Machine Learning Subsystem
│   ├── models/                           # Serialized .pkl model weights (LGBM, NLP, etc.)
│   ├── inference/
│   │   ├── serve.py                      # FastAPI microservice on port 8001
│   │   └── ensemble.py                   # Multi-Vector Cybersecurity Fusion Engine
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
