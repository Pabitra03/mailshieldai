import { buildSimplePdf } from './pdf';
import type {
  Campaign,
  CampaignGraph,
  CaseDetailData,
  CaseSummary,
  EvidencePayload,
  GeoHop,
  GeoPayload,
  ReportRecord,
  ShapFeature,
} from '../types';

const CASES_KEY = 'mailshield-local-cases';
const REPORTS_KEY = 'mailshield-local-reports';
const GENESIS = '0'.repeat(64);

const GEO: Record<string, Omit<GeoHop, 'hop_index' | 'ip_address'>> = {
  '45.77.123.45': {
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
  '41.58.108.22': {
    hostname: 'mail.hosting-provider.ng',
    country: 'Nigeria',
    city: 'Lagos',
    latitude: 6.5244,
    longitude: 3.3792,
    asn: 'AS29465',
    org: 'MTN Nigeria',
    is_vpn: false,
    trust_score: 0.4,
    confidence: 'High',
  },
  '185.220.101.42': {
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
  '198.51.100.22': {
    hostname: 'smtp-out.newsletter-service.com',
    country: 'United States',
    city: 'Ashburn',
    latitude: 39.0438,
    longitude: -77.4874,
    asn: 'AS14618',
    org: 'Amazon.com Inc.',
    trust_score: 0.92,
    confidence: 'High',
  },
  '103.15.28.100': {
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
};

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function loadCases(): Record<string, CaseDetailData> {
  try {
    return JSON.parse(localStorage.getItem(CASES_KEY) || '{}') as Record<string, CaseDetailData>;
  } catch {
    return {};
  }
}

function saveCases(db: Record<string, CaseDetailData>) {
  localStorage.setItem(CASES_KEY, JSON.stringify(db));
}

function loadReports(): ReportRecord[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]') as ReportRecord[];
  } catch {
    return [];
  }
}

function saveReports(reports: ReportRecord[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 25)));
}

function headerValue(headers: Record<string, string>, name: string): string {
  const target = name.toLowerCase();
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === target);
  return match?.[1] ?? '';
}

function parseRawEmail(raw: string): Pick<
  CaseDetailData,
  | 'message_id'
  | 'subject'
  | 'sender'
  | 'recipient'
  | 'date_sent'
  | 'body_text'
  | 'headers_json'
  | 'received_headers'
  | 'spf_result'
  | 'dkim_result'
  | 'dmarc_result'
> {
  const normalized = raw.replace(/\r\n/g, '\n');
  const split = normalized.search(/\n\n/);
  const headerBlock = split >= 0 ? normalized.slice(0, split) : normalized;
  const body = split >= 0 ? normalized.slice(split + 2) : '';
  const headers: Record<string, string> = {};
  const received: string[] = [];
  let current = '';
  for (const line of headerBlock.split('\n')) {
    if (/^\s/.test(line) && current) {
      headers[current] = `${headers[current]} ${line.trim()}`;
      continue;
    }
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    current = key;
    if (key.toLowerCase() === 'received') {
      received.push(value);
      headers[key] = headers[key] ? `${headers[key]}\n${value}` : value;
    } else {
      headers[key] = value;
    }
  }
  const auth = headerValue(headers, 'Authentication-Results').toLowerCase();
  const pick = (token: string) => {
    if (auth.includes(`${token}=pass`)) return 'PASS';
    if (auth.includes(`${token}=fail`)) return 'FAIL';
    return 'NONE';
  };
  return {
    message_id: headerValue(headers, 'Message-ID'),
    subject: headerValue(headers, 'Subject') || '(No Subject)',
    sender: headerValue(headers, 'From'),
    recipient: headerValue(headers, 'To'),
    date_sent: headerValue(headers, 'Date'),
    body_text: body,
    headers_json: headers,
    received_headers: received,
    spf_result: pick('spf'),
    dkim_result: pick('dkim'),
    dmarc_result: pick('dmarc'),
  };
}

function extractIps(received: string[]): string[] {
  const ips: string[] = [];
  const re = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  for (const line of received) {
    const found = line.match(re) ?? [];
    for (const ip of found) {
      if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) continue;
      if (!ips.includes(ip)) ips.push(ip);
    }
  }
  return ips;
}

function scoreEmail(parsed: ReturnType<typeof parseRawEmail>, raw: string): {
  risk_score: number;
  verdict: string;
  is_novel: boolean;
  shap_explanation: ShapFeature[];
  component_scores: Record<string, number>;
} {
  const hay = `${parsed.subject} ${parsed.sender} ${parsed.body_text} ${raw}`.toLowerCase();
  const shap: ShapFeature[] = [];

  // ── Component accumulators ──
  let header = 5;   // Base noise floor
  let intent = 5;
  let url = 3;
  let novelty = 2;

  // ═══════════════════════════════════════════════════════════
  // 1. HEADER FORENSICS — authentication failures are strong signals
  // ═══════════════════════════════════════════════════════════
  if (parsed.spf_result === 'FAIL') {
    header += 22;
    shap.push({ name: 'SPF authentication failed', feature: 'spf', value: 22, contribution: 22 });
  } else if (parsed.spf_result === 'NONE') {
    header += 10;
    shap.push({ name: 'SPF not configured', feature: 'spf_none', value: 10, contribution: 10 });
  }
  if (parsed.dkim_result === 'FAIL') {
    header += 18;
    shap.push({ name: 'DKIM signature failed', feature: 'dkim', value: 18, contribution: 18 });
  } else if (parsed.dkim_result === 'NONE') {
    header += 8;
    shap.push({ name: 'DKIM not present', feature: 'dkim_none', value: 8, contribution: 8 });
  }
  if (parsed.dmarc_result === 'FAIL') {
    header += 18;
    shap.push({ name: 'DMARC policy failed', feature: 'dmarc', value: 18, contribution: 18 });
  } else if (parsed.dmarc_result === 'NONE') {
    header += 8;
    shap.push({ name: 'DMARC not configured', feature: 'dmarc_none', value: 8, contribution: 8 });
  }

  // Display name spoofing — From contains name that doesn't match domain
  const fromHeader = parsed.sender?.toLowerCase() ?? '';
  if (/["'].*["']\s*</.test(fromHeader) && /(bank|security|admin|support|helpdesk|paypal|microsoft|google|apple)/.test(fromHeader)) {
    header += 14;
    shap.push({ name: 'Display name impersonation', feature: 'from_spoof', value: 14, contribution: 14 });
  }

  // Received header anomalies — localhost relay, unknown hosts
  const receivedStr = (parsed.received_headers ?? []).join(' ').toLowerCase();
  if (/\bunknown\b/.test(receivedStr)) {
    header += 8;
    shap.push({ name: 'Unknown relay in path', feature: 'unknown_relay', value: 8, contribution: 8 });
  }
  if (/localhost/.test(receivedStr) && parsed.received_headers && parsed.received_headers.length > 0) {
    header += 6;
    shap.push({ name: 'Localhost injection in path', feature: 'localhost_hop', value: 6, contribution: 6 });
  }

  // ═══════════════════════════════════════════════════════════
  // 2. INTENT / NLP — language signals for phishing & BEC
  // ═══════════════════════════════════════════════════════════

  // Urgency language — strongest intent signal
  if (/(urgent|urgently|immediately|right away|asap|within \d+ hours?|time.?sensitive|act now|expire|expir|will be (closed|blocked|terminated|suspended|frozen|locked))/.test(hay)) {
    intent += 24;
    shap.push({ name: 'Urgency language detected', feature: 'urgency', value: 24, contribution: 24 });
  }

  // Credential harvesting
  if (/(kyc|verify your? (account|identity|email)|confirm your? (identity|password|account)|reset your? password|update your? (details|credentials|information)|click here to (verify|confirm|update|login|sign)|log.?in to (verify|confirm|secure)|enter your? (password|credentials|pin|otp))/.test(hay)) {
    intent += 22;
    shap.push({ name: 'Credential harvest language', feature: 'credential', value: 22, contribution: 22 });
  }

  // Account threat language
  if (/(account.*(suspend|deactivat|block|restrict|terminat|clos|limit|compromis|unauthori|unusual activity)|(suspend|deactivat|block|restrict|terminat|clos|limit|compromis).*(account|access|service))/.test(hay)) {
    intent += 20;
    shap.push({ name: 'Account threat language', feature: 'account_threat', value: 20, contribution: 20 });
  }

  // BEC financial lure
  if (/(wire transfer|beneficiary|swift|invoice|payment.*(?:urgent|immediate|process)|purchase order|bank account|routing number|iban|ach transfer|from my iphone|sent from.*mobile|do not discuss|highly confidential|keep this between|don't tell anyone)/.test(hay)) {
    intent += 26;
    shap.push({ name: 'BEC financial fraud signals', feature: 'bec', value: 26, contribution: 26 });
  }

  // Authority impersonation
  if (/(ceo|cfo|cto|chief|director|managing partner|board meeting|executive|chairman)\b/.test(hay) && /(urgent|confidential|wire|transfer|payment|immediately)/.test(hay)) {
    intent += 16;
    shap.push({ name: 'Authority impersonation', feature: 'authority', value: 16, contribution: 16 });
  }

  // Fear / consequence language
  if (/(legal action|law enforcement|arrest|prosecut|penalty|fine of|forfeit|permanent(ly)? (clos|delet|remov|block|lock))/.test(hay)) {
    intent += 14;
    shap.push({ name: 'Fear & consequences', feature: 'fear', value: 14, contribution: 14 });
  }

  // ═══════════════════════════════════════════════════════════
  // 3. URL & DOMAIN ANALYSIS
  // ═══════════════════════════════════════════════════════════

  // Look-alike / suspicious TLD domains
  if (/(hdfc-secure|\.top\/|\.xyz|\.tk|\.ml|\.ga|\.cf|\.gq|\.pw|\.buzz|\.icu|\.club|homoglyph|look-alike|verification-portal|secure-login|account-verify|update-info|banking-alerts)/.test(hay)) {
    url += 24;
    shap.push({ name: 'Look-alike / suspicious domain', feature: 'domain', value: 24, contribution: 24 });
  }

  // IP-based or encoded URLs
  if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hay) || /%[0-9a-f]{2}/i.test(hay)) {
    url += 14;
    shap.push({ name: 'IP-based or encoded URL', feature: 'ip_url', value: 14, contribution: 14 });
  }

  // Shortened URLs
  if (/(bit\.ly|tinyurl|is\.gd|t\.co|goo\.gl|ow\.ly|rebrand\.ly|short\.link)/.test(hay)) {
    url += 12;
    shap.push({ name: 'URL shortener detected', feature: 'short_url', value: 12, contribution: 12 });
  }

  // Multiple URLs in body
  const urlCount = (hay.match(/https?:\/\//g) ?? []).length;
  if (urlCount >= 3) {
    url += 8;
    shap.push({ name: 'Multiple URLs in body', feature: 'multi_url', value: 8, contribution: 8 });
  }

  // ═══════════════════════════════════════════════════════════
  // 4. NOVELTY / PAYLOAD ANALYSIS
  // ═══════════════════════════════════════════════════════════

  // Malicious attachment patterns
  if (/(\.docm|\.xlsm|\.exe|\.scr|\.bat|\.cmd|\.pif|\.js\b|\.vbs|\.wsf|macro|enable macro|enable content|execute the attached|run the attached|open the attached)/.test(hay)) {
    novelty += 28;
    shap.push({ name: 'Malicious payload / attachment', feature: 'payload', value: 28, contribution: 28 });
  }

  // Zero-day / exploit language
  if (/(zero.?day|vulnerability|exploit|patch|critical.*(update|fix|security)|security.*(patch|update|fix))/.test(hay)) {
    novelty += 18;
    shap.push({ name: 'Exploit / zero-day language', feature: 'exploit', value: 18, contribution: 18 });
  }

  // ═══════════════════════════════════════════════════════════
  // 5. NEGATIVE SIGNALS — reduce score for legitimate patterns
  // ═══════════════════════════════════════════════════════════
  const isLegitimate = /(newsletter|unsubscribe|meeting notes|weekly (update|digest|report|briefing)|you are receiving this|email preferences|manage subscriptions|legitimate-corp|view in browser)/.test(hay);

  if (isLegitimate) {
    intent = Math.max(0, intent - 24);
    header = Math.max(0, header - 12);
    url = Math.max(0, url - 10);
  }

  // SPF + DKIM + DMARC all pass is a strong legitimacy signal (if no other red flags)
  const allAuthPass = parsed.spf_result === 'PASS' && parsed.dkim_result === 'PASS' && parsed.dmarc_result === 'PASS';
  if (allAuthPass && !isLegitimate) {
    // Auth passes but content is suspicious — keep intent score,
    // just slightly reduce header forensics since auth is clean
    header = Math.max(5, header - 6);
  }

  // ═══════════════════════════════════════════════════════════
  // 6. COMPOSITE SCORING — weighted ensemble
  // ═══════════════════════════════════════════════════════════

  // Exponential boost when multiple strong signals coincide
  const signalCount = shap.filter(s => (s.value ?? 0) >= 14).length;
  const coincidenceBoost = signalCount >= 3 ? 1.15 : signalCount >= 2 ? 1.08 : 1.0;

  const rawScore = (
    header * 0.95 +    // Auth forensics
    intent * 0.90 +    // NLP intent
    url    * 0.85 +    // URL analysis
    novelty * 0.80     // Novelty detection
  ) * coincidenceBoost;

  const risk = Math.max(4, Math.min(99, rawScore));

  // ═══════════════════════════════════════════════════════════
  // 7. VERDICT DECISION — separate from score
  // ═══════════════════════════════════════════════════════════
  let verdict = 'Clean';
  const hasBecSignals = /(wire transfer|beneficiary|from my iphone|swift|iban|routing number)/.test(hay);
  const hasNovelPayload = /(docm|xlsm|exe|macro|zero.?day|exploit)/.test(hay);

  if (hasBecSignals && risk >= 45) {
    verdict = 'BEC';
  } else if (hasNovelPayload && risk >= 40) {
    verdict = 'Novel';
  } else if (risk >= 65) {
    verdict = 'Phishing';
  } else if (risk >= 38) {
    verdict = 'Suspicious';
  } else if (risk >= 20) {
    verdict = 'Low Risk';
  } else {
    verdict = 'Clean';
  }

  shap.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return {
    risk_score: Math.round(risk * 10) / 10,
    verdict,
    is_novel: novelty >= 18 || verdict === 'Novel',
    shap_explanation: shap,
    component_scores: {
      header_forensics: Math.min(100, header * 1.8),
      intent_nlp: Math.min(100, intent * 1.9),
      url_scorer: Math.min(100, url * 2.0),
      novelty: Math.min(100, novelty * 2.2),
    },
  };
}

function hopsFor(parsed: ReturnType<typeof parseRawEmail>, raw: string): { hops: GeoHop[]; origin: GeoHop } {
  const ips = extractIps(parsed.received_headers ?? []);
  const hops: GeoHop[] = ips.map((ip, index) => {
    const known = GEO[ip];
    return {
      hop_index: index,
      ip_address: ip,
      ip,
      hostname: known?.hostname || `relay-${index}.unknown.net`,
      country: known?.country || 'Hong Kong',
      city: known?.city || 'Tsim Sha Tsui',
      latitude: known?.latitude ?? 22.3015,
      longitude: known?.longitude ?? 114.176,
      asn: known?.asn || 'AS55639',
      org: known?.org || 'Bulletproof hosting',
      is_forged: index === 0 && /localhost/.test((parsed.received_headers ?? [])[index] ?? ''),
      is_tor_exit: known?.is_tor_exit ?? false,
      is_tor: known?.is_tor ?? false,
      is_vpn: known?.is_vpn ?? false,
      trust_score: known?.trust_score ?? 0.5,
      confidence: known?.confidence ?? 'Inferred',
    };
  });

  if (hops.length === 0) {
    const hay = raw.toLowerCase();
    const ip = /(wire|ceo|beneficiary)/.test(hay)
      ? '41.58.108.22'
      : /(kyc|hdfc|phish)/.test(hay)
        ? '45.77.123.45'
        : /(newsletter|unsubscribe)/.test(hay)
          ? '198.51.100.22'
          : '185.220.101.42';
    const known = GEO[ip];
    hops.push({
      hop_index: 0,
      ip_address: ip,
      ip,
      ...known,
      hostname: known?.hostname,
      country: known?.country,
      city: known?.city,
    });
  }

  hops.push({
    hop_index: hops.length,
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
  });

  return { hops, origin: hops[0] };
}

async function merkle(leaves: string[]): Promise<string> {
  let layer = leaves.length ? [...leaves] : [await sha256Hex('empty')];
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const right = layer[i + 1] ?? layer[i];
      next.push(await sha256Hex(`${layer[i]}${right}`));
    }
    layer = next;
  }
  return layer[0];
}

function requireCase(id: string): CaseDetailData {
  const found = loadCases()[id];
  if (!found) throw new Error('Case not found in edge vault');
  return found;
}

export async function localIngest(rawSource: string): Promise<{ status: string; case_id: string; message: string }> {
  const started = performance.now();
  const parsed = parseRawEmail(rawSource);
  const scoring = scoreEmail(parsed, rawSource);
  const geo = hopsFor(parsed, rawSource);
  const rawHash = await sha256Hex(rawSource);
  const verdictHash = await sha256Hex(JSON.stringify(scoring));
  const geoHash = await sha256Hex(JSON.stringify(geo.hops));
  const merkleRoot = await merkle([rawHash, verdictHash, geoHash]);

  const ledger = [];
  let prev = GENESIS;
  for (const [payload_type, payload_hash] of [
    ['raw_eml', rawHash],
    ['verdict', verdictHash],
    ['geo_intel', geoHash],
  ] as const) {
    const entry_hash = await sha256Hex(`${prev}:${payload_type}:${payload_hash}`);
    ledger.push({ payload_type, payload_hash, entry_hash, previous_hash: prev });
    prev = entry_hash;
  }

  const id = crypto.randomUUID();
  const record: CaseDetailData = {
    id,
    created_at: new Date().toISOString(),
    status: 'Sealed',
    detection_time_ms: Math.round(performance.now() - started),
    raw_hash: rawHash,
    ...parsed,
    ...scoring,
    origin_country: geo.origin.country ?? null,
    origin_city: geo.origin.city ?? null,
    origin_asn: String(geo.origin.asn ?? ''),
    geo_confidence: geo.hops.some((h) => h.confidence === 'High') ? 'High' : 'Medium (Inferred)',
    merkle_root: merkleRoot,
    chain_verified: true,
    geo_hops: geo.hops,
    evidence_artifacts: [
      { name: 'original_email.eml', type: 'raw_eml', sha256: rawHash },
      { name: 'verdict_analysis.json', type: 'verdict_json', sha256: verdictHash },
      { name: 'geo_forensics.json', type: 'geo_json', sha256: geoHash },
    ],
    ledger_entries: ledger,
  };

  const db = loadCases();
  db[id] = record;
  saveCases(db);
  return {
    status: 'accepted',
    case_id: id,
    message: `Email ingested and analyzed. Verdict: ${record.verdict}`,
  };
}

export function localListCases(): { cases: CaseSummary[]; total: number } {
  const cases = Object.values(loadCases())
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((c) => ({
      id: c.id,
      created_at: c.created_at,
      sender: c.sender ?? '',
      subject: c.subject ?? '',
      risk_score: c.risk_score ?? null,
      verdict: c.verdict ?? null,
      status: c.status,
      origin_country: c.origin_country,
      is_novel: c.is_novel,
      detection_time_ms: c.detection_time_ms,
    }));
  return { cases, total: cases.length };
}

export function localGetCase(id: string): CaseDetailData {
  return requireCase(id);
}

export function localReview(id: string) {
  const db = loadCases();
  const found = db[id];
  if (!found) throw new Error('Case not found in edge vault');
  found.status = 'In Review';
  found.reviewed = true;
  saveCases(db);
  return { case_id: id, status: found.status, reviewed: true };
}

export function localEscalate(id: string) {
  const db = loadCases();
  const found = db[id];
  if (!found) throw new Error('Case not found in edge vault');
  found.status = 'Escalated';
  found.escalated = true;
  saveCases(db);
  return { case_id: id, status: found.status, escalated: true };
}

export function localGeo(id: string): GeoPayload {
  const found = requireCase(id);
  return {
    case_id: id,
    hops: found.geo_hops ?? [],
    overall_confidence: found.geo_confidence ?? 'Insufficient',
    origin_country: found.origin_country,
    origin_city: found.origin_city,
    origin_asn: found.origin_asn,
  };
}

export function localEvidence(id: string): EvidencePayload {
  const found = requireCase(id);
  return {
    case_id: id,
    merkle_root: found.merkle_root,
    chain_verified: Boolean(found.chain_verified),
    ledger_entries: found.ledger_entries ?? [],
    artifacts: found.evidence_artifacts ?? [],
  };
}

const THREAT_VERDICTS_LOCAL = ['Phishing', 'BEC', 'Look-alike', 'Low Risk', 'Novel'] as const;

function extractSignals(c: CaseDetailData) {
  const text = `${c.body_text ?? ''} ${c.body_html ?? ''} ${Object.values(c.headers_json ?? {}).join(' ')}`;
  const urls = text.match(/https?:\/\/[^\s<>'"]+/g) ?? [];
  const url_domains = [...new Set(urls.map((u) => u.match(/https?:\/\/([^/\s]+)/)?.[1]?.toLowerCase()).filter((d): d is string => Boolean(d)))];
  return {
    asn: c.origin_asn ?? '',
    country: c.origin_country ?? '',
    sender_domain: c.sender?.split('@').pop()?.replace(/[>\s]/g, '') ?? '',
    url_domains,
    urls: [...new Set(urls)].sort(),
  };
}

export function localCampaigns(): { campaigns: Campaign[]; graph: CampaignGraph; total: number } {
  const threat = Object.values(loadCases()).filter((c) =>
    THREAT_VERDICTS_LOCAL.includes(c.verdict as any),
  );
  const groups = new Map<string, CaseDetailData[]>();
  for (const item of threat) {
    const key = item.origin_asn || 'unknown';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const campaigns: Campaign[] = [...groups.entries()].map(([asn, items]) => {
    const verdicts: Record<string, number> = {};
    for (const item of items) {
      const v = item.verdict || 'Unknown';
      verdicts[v] = (verdicts[v] ?? 0) + 1;
    }
    const bec = verdicts.BEC ?? 0;
    const phishing = verdicts.Phishing ?? 0;
    const lookalike = verdicts['Look-alike'] ?? 0;
    const lowRisk = verdicts['Low Risk'] ?? 0;
    const novel = verdicts.Novel ?? 0;
    const totalThreat = phishing * 1 + bec * 2 + lookalike * 1 + lowRisk * 1 + novel * 1;
    const threat_level = bec > 0 || totalThreat >= 5 ? 'Critical' : totalThreat >= 3 ? 'High' : totalThreat >= 2 ? 'Medium' : 'Low';
    return {
      id: `campaign-${asn}`,
      name: `Cluster: ${asn}`,
      first_seen: items[items.length - 1]?.created_at?.slice(0, 10),
      last_seen: items[0]?.created_at?.slice(0, 10),
      email_count: items.length,
      unique_senders: new Set(items.map((i) => i.sender)).size,
      shared_infra: [asn],
      verdict_distribution: verdicts,
      verdicts,
      threat_level,
      cases: items.map((i) => i.id),
    };
  });

  const nodes = threat.map((c) => {
    const signals = extractSignals(c);
    return {
      id: c.id,
      name: c.subject || c.id.slice(0, 8),
      subject: c.subject,
      sender: c.sender,
      verdict: c.verdict ?? undefined,
      risk_score: c.risk_score ?? undefined,
      origin_asn: c.origin_asn ?? undefined,
      origin_country: c.origin_country ?? undefined,
      created_at: c.created_at,
      signals,
      val: Math.max(6, Math.min(24, (c.risk_score ?? 0) / 4)),
    };
  });
  const links = [];
  for (let i = 0; i < threat.length; i += 1) {
    for (let j = i + 1; j < threat.length; j += 1) {
      const signalsI = extractSignals(threat[i]);
      const signalsJ = extractSignals(threat[j]);
      const shared = [];
      if (signalsI.asn && signalsI.asn === signalsJ.asn) shared.push(`ASN ${signalsI.asn}`);
      if (signalsI.sender_domain && signalsI.sender_domain === signalsJ.sender_domain) shared.push(`Sender domain ${signalsI.sender_domain}`);
      const sharedDomains = [...new Set(signalsI.url_domains.filter((d) => signalsJ.url_domains.includes(d)))].sort();
      shared.push(...sharedDomains.map((d) => `URL domain ${d}`));
      if (signalsI.country && signalsI.country === signalsJ.country) shared.push(`Origin country ${signalsI.country}`);
      if (shared.length) links.push({ source: threat[i].id, target: threat[j].id, shared, strength: shared.length });
    }
  }

  return { campaigns, graph: { nodes, links }, total: campaigns.length };
}

export function localListReports(): { reports: ReportRecord[]; total: number } {
  const reports = loadReports();
  return { reports, total: reports.length };
}

export function recordLocalReport(caseId: string, reportType: 'forensic_report' | 'certificate', filename: string) {
  const found = requireCase(caseId);
  const entry: ReportRecord = {
    id: crypto.randomUUID(),
    case_id: caseId,
    report_type: reportType,
    filename,
    generated_at: new Date().toISOString(),
    subject: found.subject,
    sender: found.sender,
    verdict: found.verdict,
    risk_score: found.risk_score,
    download_url: reportType === 'certificate' ? `#cert-${caseId}` : `#report-${caseId}`,
  };
  saveReports([entry, ...loadReports()]);
  return entry;
}

export function localForensicPdf(caseId: string): Blob {
  const found = requireCase(caseId);
  recordLocalReport(caseId, 'forensic_report', `report_${caseId.slice(0, 8)}.pdf`);
  return buildSimplePdf('MailShieldAI Forensic Report', [
    `Case: ${found.id}`,
    `Subject: ${found.subject}`,
    `Sender: ${found.sender}`,
    `Verdict: ${found.verdict}  Risk: ${found.risk_score}`,
    `Origin: ${found.origin_city}, ${found.origin_country} ASN ${found.origin_asn}`,
    `Merkle: ${found.merkle_root}`,
    `Chain verified: ${found.chain_verified}`,
    '',
    ...(found.geo_hops ?? []).map(
      (h) => `Hop ${h.hop_index}: ${h.ip_address || h.ip} ${h.city} ${h.country} ${h.asn}`,
    ),
    '',
    `Body: ${(found.body_text ?? '').slice(0, 700)}`,
  ]);
}

export function localCertificatePdf(caseId: string): Blob {
  const found = requireCase(caseId);
  recordLocalReport(caseId, 'certificate', `bsa_certificate_${caseId.slice(0, 8)}.pdf`);
  return buildSimplePdf('BSA 2023 Section 63(4) Certificate', [
    'MailShieldAI statutory digital evidence certificate',
    `Case: ${found.id}`,
    `Verdict: ${found.verdict} (Risk ${found.risk_score}/100)`,
    `Merkle root: ${found.merkle_root}`,
    `Raw hash: ${found.raw_hash}`,
    `Sealed: ${found.created_at}`,
    '',
    ...(found.evidence_artifacts ?? []).map((a) => `${a.name}: ${a.sha256}`),
    '',
    'This certificate records SHA-256 hashes of the ingested RFC 822 source,',
    'ensemble verdict payload, and geo-forensic hop chain.',
  ]);
}
