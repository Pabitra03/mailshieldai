export type Verdict =
  | 'Clean'
  | 'Low Risk'
  | 'Suspicious'
  | 'Phishing'
  | 'BEC'
  | 'Look-alike'
  | 'Malware'
  | 'Novel'
  | 'Unknown';

export interface CaseSummary {
  id: string;
  created_at?: string;
  sender: string;
  subject: string;
  risk_score: number | null;
  verdict: string | null;
  status?: string;
  origin_country?: string | null;
  is_novel?: boolean;
  detection_time_ms?: number | null;
}

export interface ShapFeature {
  feature?: string;
  name?: string;
  value?: number;
  contribution?: number;
  shap_value?: number;
  description?: string;
}

export interface GeoHop {
  hop_index?: number;
  hop_number?: number;
  ip_address?: string;
  ip?: string;
  hostname?: string;
  country?: string;
  city?: string;
  country_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  asn?: string | number;
  org?: string;
  asn_name?: string;
  is_forged?: boolean;
  is_tor_exit?: boolean;
  is_tor?: boolean;
  is_vpn?: boolean;
  is_proxy?: boolean;
  trust_score?: number;
  confidence?: string | number;
  timestamp?: string;
}

export interface LedgerEntry {
  payload_type?: string;
  payload_hash?: string;
  entry_hash?: string;
  previous_hash?: string;
}

export interface EvidenceArtifact {
  name: string;
  type?: string;
  sha256?: string;
  sha512?: string;
}

export interface CaseDetailData {
  id: string;
  created_at?: string;
  status?: string;
  detection_time_ms?: number | null;
  raw_hash?: string;
  message_id?: string;
  subject?: string;
  sender?: string;
  recipient?: string;
  date_sent?: string;
  body_text?: string;
  body_html?: string;
  headers_json?: Record<string, string>;
  received_headers?: string[];
  attachments_json?: Array<Record<string, unknown>>;
  spf_result?: string;
  dkim_result?: string;
  dmarc_result?: string;
  risk_score?: number | null;
  verdict?: string | null;
  shap_explanation?: ShapFeature[] | Record<string, unknown>;
  origin_country?: string | null;
  origin_city?: string | null;
  origin_asn?: string | null;
  geo_confidence?: string | null;
  merkle_root?: string | null;
  chain_verified?: boolean | null;
  is_novel?: boolean;
  geo_hops?: GeoHop[];
  evidence_artifacts?: EvidenceArtifact[];
  ledger_entries?: LedgerEntry[];
  component_scores?: Record<string, number>;
  reviewed?: boolean;
  escalated?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  first_seen?: string;
  last_seen?: string;
  email_count: number;
  unique_senders?: number;
  shared_infra?: string[];
  verdict_distribution?: Record<string, number>;
  verdicts?: Record<string, number>;
  threat_level?: string;
  cases?: string[];
}

export interface CampaignGraphNode {
  id: string;
  name: string;
  subject?: string;
  sender?: string;
  verdict?: string;
  risk_score?: number;
  origin_asn?: string;
  origin_country?: string;
  created_at?: string;
  val?: number;
}

export interface CampaignGraphLink {
  source: string;
  target: string;
  shared?: string[];
  strength?: number;
}

export interface CampaignGraph {
  nodes: CampaignGraphNode[];
  links: CampaignGraphLink[];
}

export interface EvidencePayload {
  case_id: string;
  merkle_root?: string | null;
  chain_verified?: boolean;
  ledger_entries?: LedgerEntry[];
  artifacts?: EvidenceArtifact[];
}

export interface GeoPayload {
  case_id: string;
  hops: GeoHop[];
  overall_confidence?: string;
  origin_country?: string | null;
  origin_city?: string | null;
  origin_asn?: string | null;
}

export interface ReportRecord {
  id: string;
  case_id: string;
  report_type: string;
  filename: string;
  generated_at: string;
  subject?: string;
  sender?: string;
  verdict?: string | null;
  risk_score?: number | null;
  download_url?: string;
}

export interface UploadProgress {
  stage: 'upload' | 'parse' | 'ml_inference' | 'geo_forensics' | 'evidence_seal' | 'complete';
  progress: number;
  message: string;
  caseId?: string;
  verdict?: string;
  riskScore?: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
