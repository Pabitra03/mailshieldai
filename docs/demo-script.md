# MailShieldAI — Demo Script

> Step-by-step walkthrough of the "Fake RBI KYC Mail" scenario for a live demo

## Scenario

A phishing email impersonating the Reserve Bank of India (RBI) is sent to a target,
demanding immediate KYC verification. The email:
- Spoofs the sender as `kyc-update@rbi.org.in` (forged From header)
- Uses urgency language ("Your account will be suspended in 24 hours")
- Contains a look-alike URL (`rbi-kyc-update.xyz`) mimicking `rbi.org.in`
- Includes the RBI logo (brand impersonation)
- Routes through a Tor exit node and a VPN provider to hide origin
- Actually originates from a hosting provider in Eastern Europe

## Demo Steps

### 1. Upload the Phishing Email
- Navigate to the Live Feed page
- Click "Upload Email" and select the demo .eml file
- Watch the real-time processing: Ingesting → Parsing → Scoring → Geo-Forensics → Sealed

### 2. Review the Verdict
- Click the new case in the Live Feed table
- Show the risk score (expected: 85+/100, verdict: "Phishing")
- Walk through the "WHY — EXPLAINABLE EVIDENCE (SHAP)" panel:
  - SPF: FAIL (contribution: +0.31)
  - Body urgency language: "account will be suspended" (contribution: +0.25)
  - URL: rbi-kyc-update.xyz (contribution: +0.22)
  - Brand logo match: RBI logo detected (contribution: +0.12)

### 3. Geo-Forensic Analysis
- Switch to the Geo-Intel tab
- Show the hop-path visualization:
  - Hop 1 (Origin): IP in Eastern Europe, hosting provider ASN
  - Hop 2 (Forged): Inserted hop claiming to be rbi.org.in — flagged as FORGED
  - Hop 3 (VPN Exit): DigitalOcean node in Singapore — flagged as VPN
  - Hop 4 (Recipient): Target's mail server
- Highlight: "The system identified the TRUE origin behind the VPN, not just the exit point"

### 4. Campaign Graph
- Switch to Campaigns page
- Show how this email is linked to 3 other phishing emails with shared infrastructure
  (same origin ASN, similar subject patterns)

### 5. Evidence Chain
- Switch to Evidence tab
- Show the chain-of-custody: raw .eml hash, verdict JSON hash, geo JSON hash
- Verify the Merkle root and hash chain integrity ("Chain: Verified ✓")

### 6. Generate Court-Ready Certificate
- Switch to Reports tab
- Click "Generate BSA §63(4) Certificate"
- Download and show the auto-filled PDF with hash values, timestamps, and custodian details

## Key Talking Points

1. **Not just blocking — attributing**: "Every email security tool can block this mail. Only MailShieldAI tells you WHO sent it and from WHERE."
2. **Honest uncertainty**: "When we can't be certain, we say so — the confidence band is 'Medium' because of the VPN layer. We never guess."
3. **Court-admissible**: "The hash-sealed evidence chain and BSA §63(4) certificate mean this analysis can be submitted as electronic evidence in an Indian court."
4. **Explainable AI**: "Every verdict comes with a SHAP-powered explanation of WHY — not a black box."

---

*This script will be updated with exact file paths and expected values after Phase 8 (demo data seeding).*
