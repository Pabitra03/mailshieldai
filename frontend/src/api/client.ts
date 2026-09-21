import type {
  Campaign,
  CampaignGraph,
  CaseDetailData,
  CaseSummary,
  EvidencePayload,
  GeoPayload,
  ReportRecord,
} from '../types';

const API = '/api';

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === 'string') return data.detail;
    return JSON.stringify(data?.detail ?? data);
  } catch {
    return res.statusText || 'Request failed';
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function ingestRawEmail(rawSource: string): Promise<{
  status: string;
  case_id: string;
  message: string;
}> {
  const body = new FormData();
  body.append('raw_source', rawSource);
  const res = await fetch(`${API}/ingest`, { method: 'POST', body });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function ingestEmailFile(file: File): Promise<{
  status: string;
  case_id: string;
  message: string;
}> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API}/ingest`, { method: 'POST', body });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function listCases(): Promise<{ cases: CaseSummary[]; total: number }> {
  return getJson('/cases');
}

export async function getCase(caseId: string): Promise<CaseDetailData> {
  return getJson(`/cases/${caseId}`);
}

export async function reviewCase(caseId: string) {
  const res = await fetch(`${API}/cases/${caseId}/review`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function escalateCase(caseId: string) {
  const res = await fetch(`${API}/cases/${caseId}/escalate`, { method: 'POST' });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getGeo(caseId: string): Promise<GeoPayload> {
  return getJson(`/cases/${caseId}/geo`);
}

export async function getEvidence(caseId: string): Promise<EvidencePayload> {
  return getJson(`/cases/${caseId}/evidence`);
}

export async function listCampaigns(): Promise<{
  campaigns: Campaign[];
  graph: CampaignGraph;
  total: number;
}> {
  return getJson('/campaigns');
}

export async function listReports(): Promise<{ reports: ReportRecord[]; total: number }> {
  return getJson('/reports');
}

export function reportPdfUrl(caseId: string) {
  return `${API}/cases/${caseId}/report.pdf`;
}

export function certificatePdfUrl(caseId: string) {
  return `${API}/cases/${caseId}/certificate.pdf`;
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch('/health');
  if (!res.ok) throw new Error('Backend offline');
  return res.json();
}
