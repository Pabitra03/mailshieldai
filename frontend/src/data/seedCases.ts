/**
 * Seed cases for the Campaign Graph.
 *
 * These pre-built threat cases are injected into localStorage on first load
 * so the Campaign Graph, Geo Forensics, and Evidence Vault pages show
 * meaningful data immediately instead of the empty-state "0 clusters / 0 nodes".
 */

import type { CaseDetailData } from '../types';

const SEED_KEY = 'mailshield-seed-applied-v2';

function seeded(): boolean {
  return localStorage.getItem(SEED_KEY) === 'true';
}

function markSeeded(): void {
  localStorage.setItem(SEED_KEY, 'true');
}

const CASES_KEY = 'mailshield-local-cases';

function loadCases(): Record<string, CaseDetailData> {
  try {
    return JSON.parse(localStorage.getItem(CASES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCases(db: Record<string, CaseDetailData>): void {
  localStorage.setItem(CASES_KEY, JSON.stringify(db));
}

const SEED_CASES: CaseDetailData[] = [
  {
    id: 'seed-hdfc-phish-001',
    created_at: '2026-09-22T08:14:00.000Z',
    status: 'Sealed',
    detection_time_ms: 287,
    raw_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    message_id: '<20260922081400.seed01@hdfc-secure.net>',
    subject: 'Urgent: Complete KYC Immediately',
    sender: 'alerts@hdfc-secure.net',
    recipient: 'victim@enterprise.com',
    date_sent: 'Tue, 22 Sep 2026 08:14:00 +0530',
    body_text:
      'Dear Customer,\n\nYour HDFC Bank account will be permanently closed within 24 hours.\nClick here to verify: https://hdfc-secure-kyc.verification-portal.top/verify\n\nHDFC Bank Security',
    headers_json: {
      From: '"HDFC Security" <alerts@hdfc-secure.net>',
      To: 'victim@enterprise.com',
      Subject: 'Urgent: Complete KYC Immediately',
      'Authentication-Results': 'spf=fail; dkim=fail; dmarc=fail',
    },
    received_headers: [
      'from mail.hdfc-secure.net (unknown [45.77.123.45]) by mx.enterprise.com',
    ],
    spf_result: 'FAIL',
    dkim_result: 'FAIL',
    dmarc_result: 'FAIL',
    risk_score: 96.5,
    verdict: 'Phishing',
    is_novel: false,
    shap_explanation: [
      { name: 'SPF fail', feature: 'spf', value: 18, contribution: 18 },
      { name: 'DKIM fail', feature: 'dkim', value: 12, contribution: 12 },
      { name: 'DMARC fail', feature: 'dmarc', value: 12, contribution: 12 },
      { name: 'Urgency language', feature: 'urgency', value: 22, contribution: 22 },
      { name: 'Credential harvest', feature: 'kyc', value: 16, contribution: 16 },
      { name: 'Look-alike domain', feature: 'domain', value: 20, contribution: 20 },
    ],
    component_scores: { header_forensics: 88, intent_nlp: 92, url_scorer: 78, novelty: 12 },
    origin_country: 'Singapore',
    origin_city: 'Singapore',
    origin_asn: 'AS20473',
    geo_confidence: 'High',
    merkle_root: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    chain_verified: true,
    geo_hops: [
      {
        hop_index: 0,
        ip_address: '45.77.123.45',
        ip: '45.77.123.45',
        hostname: 'mail.hdfc-secure.net',
        country: 'Singapore',
        city: 'Singapore',
        latitude: 1.3521,
        longitude: 103.8198,
        asn: 'AS20473',
        org: 'The Constant Company',
        is_vpn: true,
        trust_score: 0.32,
        confidence: 'High',
      },
      {
        hop_index: 1,
        ip_address: '203.0.113.50',
        ip: '203.0.113.50',
        hostname: 'mx.enterprise-defense.internal',
        country: 'United States',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        asn: 'AS14618',
        org: 'Amazon.com Inc.',
        trust_score: 0.95,
        confidence: 'High',
      },
    ],
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: 'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5' },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' },
    ],
    ledger_entries: [
      { payload_type: 'raw_eml', payload_hash: 'a1b2c3d4', entry_hash: '1111aaaa', previous_hash: '0'.repeat(64) },
      { payload_type: 'verdict', payload_hash: 'f6e5d4c3', entry_hash: '2222bbbb', previous_hash: '1111aaaa' },
      { payload_type: 'geo_intel', payload_hash: 'c3d4e5f6', entry_hash: '3333cccc', previous_hash: '2222bbbb' },
    ],
  },
  {
    id: 'seed-hdfc-phish-002',
    created_at: '2026-09-22T11:42:00.000Z',
    status: 'Sealed',
    detection_time_ms: 312,
    raw_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    message_id: '<20260922114200.seed02@hdfc-secure.net>',
    subject: 'HDFC Account Suspended — Verify Now',
    sender: 'noreply@hdfc-secure.net',
    recipient: 'employee@corp.in',
    date_sent: 'Tue, 22 Sep 2026 11:42:00 +0530',
    body_text:
      'Your account has been suspended due to unusual activity.\nVerify immediately: https://hdfc-secure.verification-portal.top/login\nFailure to act within 24 hours will permanently close your account.',
    headers_json: {
      From: '"HDFC Bank" <noreply@hdfc-secure.net>',
      To: 'employee@corp.in',
      Subject: 'HDFC Account Suspended — Verify Now',
      'Authentication-Results': 'spf=fail; dkim=fail; dmarc=fail',
    },
    received_headers: [
      'from mail.hdfc-secure.net (unknown [45.77.123.45]) by mx.corp.in',
    ],
    spf_result: 'FAIL',
    dkim_result: 'FAIL',
    dmarc_result: 'FAIL',
    risk_score: 93.2,
    verdict: 'Phishing',
    is_novel: false,
    shap_explanation: [
      { name: 'SPF fail', feature: 'spf', value: 18, contribution: 18 },
      { name: 'Urgency language', feature: 'urgency', value: 22, contribution: 22 },
      { name: 'Credential harvest', feature: 'kyc', value: 16, contribution: 16 },
      { name: 'Look-alike domain', feature: 'domain', value: 20, contribution: 20 },
    ],
    component_scores: { header_forensics: 84, intent_nlp: 89, url_scorer: 76, novelty: 8 },
    origin_country: 'Singapore',
    origin_city: 'Singapore',
    origin_asn: 'AS20473',
    geo_confidence: 'High',
    merkle_root: 'd4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3',
    chain_verified: true,
    geo_hops: [
      {
        hop_index: 0,
        ip_address: '45.77.123.45',
        ip: '45.77.123.45',
        hostname: 'mail.hdfc-secure.net',
        country: 'Singapore',
        city: 'Singapore',
        latitude: 1.3521,
        longitude: 103.8198,
        asn: 'AS20473',
        org: 'The Constant Company',
        is_vpn: true,
        trust_score: 0.32,
        confidence: 'High',
      },
      {
        hop_index: 1,
        ip_address: '203.0.113.50',
        ip: '203.0.113.50',
        hostname: 'mx.enterprise-defense.internal',
        country: 'United States',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        asn: 'AS14618',
        org: 'Amazon.com Inc.',
        trust_score: 0.95,
        confidence: 'High',
      },
    ],
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3' },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6' },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: 'd4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3' },
    ],
    ledger_entries: [
      { payload_type: 'raw_eml', payload_hash: 'b2c3d4e5', entry_hash: '4444dddd', previous_hash: '0'.repeat(64) },
      { payload_type: 'verdict', payload_hash: 'e5f6a1b2', entry_hash: '5555eeee', previous_hash: '4444dddd' },
      { payload_type: 'geo_intel', payload_hash: 'd4c3b2a1', entry_hash: '6666ffff', previous_hash: '5555eeee' },
    ],
  },
  {
    id: 'seed-bec-wire-001',
    created_at: '2026-09-23T06:30:00.000Z',
    status: 'Sealed',
    detection_time_ms: 341,
    raw_hash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    message_id: '<20260923063000.seed03@company.com>',
    subject: 'URGENT: Wire Transfer Required',
    sender: 'ceo@company.com',
    recipient: 'finance@company.com',
    date_sent: 'Wed, 23 Sep 2026 06:30:00 +0530',
    body_text:
      'I need you to process an urgent wire transfer. This is confidential.\n\nBeneficiary: Global Tech Solutions\nAmount: $47,500 USD\nSWIFT: HSBCHKHHHKH\n\nSent from my iPhone',
    headers_json: {
      From: '"CEO John Smith" <ceo@company.com>',
      To: 'finance@company.com',
      Subject: 'URGENT: Wire Transfer Required',
      'Authentication-Results': 'spf=pass; dkim=pass; dmarc=pass',
    },
    received_headers: [
      'from mail.hosting-provider.ng (unknown [41.58.108.22]) by mx.company.com',
    ],
    spf_result: 'PASS',
    dkim_result: 'PASS',
    dmarc_result: 'PASS',
    risk_score: 82.1,
    verdict: 'BEC',
    is_novel: false,
    shap_explanation: [
      { name: 'BEC finance lure', feature: 'bec', value: 20, contribution: 20 },
      { name: 'Urgency language', feature: 'urgency', value: 22, contribution: 22 },
    ],
    component_scores: { header_forensics: 16, intent_nlp: 94, url_scorer: 8, novelty: 6 },
    origin_country: 'Nigeria',
    origin_city: 'Lagos',
    origin_asn: 'AS29465',
    geo_confidence: 'High',
    merkle_root: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    chain_verified: true,
    geo_hops: [
      {
        hop_index: 0,
        ip_address: '41.58.108.22',
        ip: '41.58.108.22',
        hostname: 'mail.hosting-provider.ng',
        country: 'Nigeria',
        city: 'Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
        asn: 'AS29465',
        org: 'MTN Nigeria',
        trust_score: 0.4,
        confidence: 'High',
      },
      {
        hop_index: 1,
        ip_address: '203.0.113.50',
        ip: '203.0.113.50',
        hostname: 'mx.enterprise-defense.internal',
        country: 'United States',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        asn: 'AS14618',
        org: 'Amazon.com Inc.',
        trust_score: 0.95,
        confidence: 'High',
      },
    ],
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1' },
    ],
    ledger_entries: [
      { payload_type: 'raw_eml', payload_hash: 'c3d4e5f6', entry_hash: '7777aaaa', previous_hash: '0'.repeat(64) },
      { payload_type: 'verdict', payload_hash: 'a1b2c3d4', entry_hash: '8888bbbb', previous_hash: '7777aaaa' },
      { payload_type: 'geo_intel', payload_hash: 'f6a1b2c3', entry_hash: '9999cccc', previous_hash: '8888bbbb' },
    ],
  },
  {
    id: 'seed-tor-novel-001',
    created_at: '2026-09-23T14:58:00.000Z',
    status: 'Sealed',
    detection_time_ms: 419,
    raw_hash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    message_id: '<20260923145800.seed04@hdfc-secure.net>',
    subject: 'Security Patch — Execute Attached .docm',
    sender: 'support@hdfc-secure.net',
    recipient: 'devops@company.com',
    date_sent: 'Wed, 23 Sep 2026 14:58:00 +0530',
    body_text:
      'Hello Team,\n\nPlease download and execute the attached configuration file.\n\nAttachment: security_patch_v2.1.docm\nThis is a zero-day vulnerability patch that must be applied within 2 hours.\n\nIT Security Division',
    headers_json: {
      From: '"Internal IT" <support@hdfc-secure.net>',
      To: 'devops@company.com',
      Subject: 'Security Patch — Execute Attached .docm',
      'Authentication-Results': 'spf=none; dkim=none; dmarc=none',
    },
    received_headers: [
      'from tor-exit-node (tor-exit-node [185.220.101.42]) by proxy.unknown.vpn',
    ],
    spf_result: 'NONE',
    dkim_result: 'NONE',
    dmarc_result: 'NONE',
    risk_score: 72.6,
    verdict: 'Novel',
    is_novel: true,
    shap_explanation: [
      { name: 'Novel payload', feature: 'novelty', value: 24, contribution: 24 },
      { name: 'Look-alike domain', feature: 'domain', value: 20, contribution: 20 },
    ],
    component_scores: { header_forensics: 40, intent_nlp: 55, url_scorer: 48, novelty: 92 },
    origin_country: 'Germany',
    origin_city: 'Frankfurt',
    origin_asn: 'AS20473',
    geo_confidence: 'High',
    merkle_root: 'b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1',
    chain_verified: true,
    geo_hops: [
      {
        hop_index: 0,
        ip_address: '185.220.101.42',
        ip: '185.220.101.42',
        hostname: 'tor-exit-node',
        country: 'Germany',
        city: 'Frankfurt',
        latitude: 50.1109,
        longitude: 8.6821,
        asn: 'AS208294',
        org: 'Tor Exit',
        is_tor_exit: true,
        is_tor: true,
        trust_score: 0.12,
        confidence: 'High',
      },
      {
        hop_index: 1,
        ip_address: '203.0.113.50',
        ip: '203.0.113.50',
        hostname: 'mx.enterprise-defense.internal',
        country: 'United States',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        asn: 'AS14618',
        org: 'Amazon.com Inc.',
        trust_score: 0.95,
        confidence: 'High',
      },
    ],
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5' },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: 'b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1' },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: 'e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4' },
    ],
    ledger_entries: [
      { payload_type: 'raw_eml', payload_hash: 'd4e5f6a1', entry_hash: 'aaaa1111', previous_hash: '0'.repeat(64) },
      { payload_type: 'verdict', payload_hash: 'b2a1e5f6', entry_hash: 'bbbb2222', previous_hash: 'aaaa1111' },
      { payload_type: 'geo_intel', payload_hash: 'e5d4c3b2', entry_hash: 'cccc3333', previous_hash: 'bbbb2222' },
    ],
  },
  {
    id: 'seed-bec-wire-002',
    created_at: '2026-09-24T03:15:00.000Z',
    status: 'Sealed',
    detection_time_ms: 298,
    raw_hash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    message_id: '<20260924031500.seed05@company.com>',
    subject: 'Vendor Payment — Wire ASAP',
    sender: 'cfo@company.com',
    recipient: 'accounts@company.com',
    date_sent: 'Thu, 24 Sep 2026 03:15:00 +0530',
    body_text:
      'Hi,\n\nPlease process an immediate wire transfer to our new vendor.\n\nBeneficiary: Asia Pacific Consulting\nBank: Standard Chartered HK\nAmount: $62,000 USD\nSWIFT: SCBLHKHHXXX\n\nThis is urgent and confidential.\n\nSent from my iPhone',
    headers_json: {
      From: '"CFO Jane Doe" <cfo@company.com>',
      To: 'accounts@company.com',
      Subject: 'Vendor Payment — Wire ASAP',
      'Authentication-Results': 'spf=pass; dkim=pass; dmarc=pass',
    },
    received_headers: [
      'from mail.hosting-provider.ng (unknown [41.58.108.22]) by mx.company.com',
    ],
    spf_result: 'PASS',
    dkim_result: 'PASS',
    dmarc_result: 'PASS',
    risk_score: 78.4,
    verdict: 'BEC',
    is_novel: false,
    shap_explanation: [
      { name: 'BEC finance lure', feature: 'bec', value: 20, contribution: 20 },
      { name: 'Urgency language', feature: 'urgency', value: 22, contribution: 22 },
    ],
    component_scores: { header_forensics: 14, intent_nlp: 91, url_scorer: 6, novelty: 4 },
    origin_country: 'Nigeria',
    origin_city: 'Lagos',
    origin_asn: 'AS29465',
    geo_confidence: 'High',
    merkle_root: 'a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5',
    chain_verified: true,
    geo_hops: [
      {
        hop_index: 0,
        ip_address: '41.58.108.22',
        ip: '41.58.108.22',
        hostname: 'mail.hosting-provider.ng',
        country: 'Nigeria',
        city: 'Lagos',
        latitude: 6.5244,
        longitude: 3.3792,
        asn: 'AS29465',
        org: 'MTN Nigeria',
        trust_score: 0.4,
        confidence: 'High',
      },
      {
        hop_index: 1,
        ip_address: '203.0.113.50',
        ip: '203.0.113.50',
        hostname: 'mx.enterprise-defense.internal',
        country: 'United States',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        asn: 'AS14618',
        org: 'Amazon.com Inc.',
        trust_score: 0.95,
        confidence: 'High',
      },
    ],
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6' },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: 'a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5' },
    ],
    ledger_entries: [
      { payload_type: 'raw_eml', payload_hash: 'e5f6a1b2', entry_hash: 'dddd4444', previous_hash: '0'.repeat(64) },
      { payload_type: 'verdict', payload_hash: 'c3d4e5f6', entry_hash: 'eeee5555', previous_hash: 'dddd4444' },
      { payload_type: 'geo_intel', payload_hash: 'a1e5f6d4', entry_hash: 'ffff6666', previous_hash: 'eeee5555' },
    ],
  },
  {
    id: 'seed-vn-phish-001',
    created_at: '2026-09-24T09:05:00.000Z',
    status: 'Sealed',
    detection_time_ms: 265,
    raw_hash: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    message_id: '<20260924090500.seed06@vps-hosting.vn>',
    subject: 'Password Reset Required — Account Compromised',
    sender: 'security@banking-alerts.xyz',
    recipient: 'user@enterprise.com',
    date_sent: 'Thu, 24 Sep 2026 09:05:00 +0530',
    body_text:
      'We detected unauthorized access to your account.\nReset your password immediately: https://banking-alerts.xyz/reset\nYour credential will expire in 2 hours.',
    headers_json: {
      From: '"Banking Security" <security@banking-alerts.xyz>',
      To: 'user@enterprise.com',
      Subject: 'Password Reset Required — Account Compromised',
      'Authentication-Results': 'spf=fail; dkim=none; dmarc=fail',
    },
    received_headers: [
      'from vps-hosting.vn (unknown [103.15.28.100]) by mx.enterprise.com',
    ],
    spf_result: 'FAIL',
    dkim_result: 'NONE',
    dmarc_result: 'FAIL',
    risk_score: 88.7,
    verdict: 'Phishing',
    is_novel: false,
    shap_explanation: [
      { name: 'SPF fail', feature: 'spf', value: 18, contribution: 18 },
      { name: 'DMARC fail', feature: 'dmarc', value: 12, contribution: 12 },
      { name: 'Credential harvest', feature: 'kyc', value: 16, contribution: 16 },
      { name: 'Urgency language', feature: 'urgency', value: 22, contribution: 22 },
      { name: 'Look-alike domain', feature: 'domain', value: 20, contribution: 20 },
    ],
    component_scores: { header_forensics: 78, intent_nlp: 86, url_scorer: 82, novelty: 10 },
    origin_country: 'Vietnam',
    origin_city: 'Ho Chi Minh City',
    origin_asn: 'AS18403',
    geo_confidence: 'Medium',
    merkle_root: 'c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2',
    chain_verified: true,
    geo_hops: [
      {
        hop_index: 0,
        ip_address: '103.15.28.100',
        ip: '103.15.28.100',
        hostname: 'vps-hosting.vn',
        country: 'Vietnam',
        city: 'Ho Chi Minh City',
        latitude: 10.8231,
        longitude: 106.6297,
        asn: 'AS18403',
        org: 'FPT Telecom',
        is_vpn: true,
        trust_score: 0.45,
        confidence: 'Medium',
      },
      {
        hop_index: 1,
        ip_address: '203.0.113.50',
        ip: '203.0.113.50',
        hostname: 'mx.enterprise-defense.internal',
        country: 'United States',
        city: 'Ashburn',
        latitude: 39.0438,
        longitude: -77.4874,
        asn: 'AS14618',
        org: 'Amazon.com Inc.',
        trust_score: 0.95,
        confidence: 'High',
      },
    ],
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1' },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5' },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: 'c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2a1e5f6d4c3b2' },
    ],
    ledger_entries: [
      { payload_type: 'raw_eml', payload_hash: 'f6a1b2c3', entry_hash: 'aaaa7777', previous_hash: '0'.repeat(64) },
      { payload_type: 'verdict', payload_hash: 'd4e5f6a1', entry_hash: 'bbbb8888', previous_hash: 'aaaa7777' },
      { payload_type: 'geo_intel', payload_hash: 'c3b2a1e5', entry_hash: 'cccc9999', previous_hash: 'bbbb8888' },
    ],
  },
];

export function injectSeedCases(): void {
  if (seeded()) return;
  const db = loadCases();
  let injected = false;
  for (const seedCase of SEED_CASES) {
    if (!db[seedCase.id]) {
      db[seedCase.id] = seedCase;
      injected = true;
    }
  }
  if (injected) {
    saveCases(db);
  }
  markSeeded();
}
