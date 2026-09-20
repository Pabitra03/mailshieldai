"""
Detection service — calls ML inference, runs the fusion ensemble.

Orchestrates:
- Header forensics (LightGBM) scoring
- Language & intent NLP scoring
- URL & domain scoring
- Brand impersonation detection
- Novelty / campaign outlier flagging
- Fusion ensemble → 0–100 risk score + verdict label
- SHAP explainability → structured "why" payload
"""
