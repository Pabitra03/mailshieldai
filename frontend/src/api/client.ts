import type {
  Campaign,
  CampaignGraph,
  CaseDetailData,
  CaseSummary,
  EvidencePayload,
  GeoPayload,
  ReportRecord,
} from '../types';

const ENV_BASE = String(import.meta.env.VITE_API_BASE ?? '')
  .trim()
  .replace(/\/$/, '');

let activeBase: string | null = null;

function candidateBases(): string[] {
  const bases: string[] = [];
  if (ENV_BASE) bases.push(ENV_BASE.endsWith('/api') ? ENV_BASE : `${ENV_BASE}/api`);
  bases.push('/api');
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const devPorts = new Set(['5173', '4173', '3000', '5174', '8080', '']);
    if (devPorts.has(port) || hostname === 'localhost' || hostname === '127.0.0.1') {
      bases.push(`${protocol}//127.0.0.1:8000/api`);
      bases.push(`${protocol}//localhost:8000/api`);
    }
  }
  return [...new Set(bases)];
}

function isHtmlPayload(text: string, res: Response): boolean {
  const type = res.headers.get('content-type') ?? '';
  const trimmed = text.trimStart();
  return type.includes('text/html') || trimmed.startsWith('<!') || trimmed.startsWith('<html');
}

async function parseBody(res: Response): Promise<{ text: string; json: unknown | null; html: boolean }> {
  const text = await res.text();
  if (isHtmlPayload(text, res)) {
    return { text, json: null, html: true };
  }
  if (!text) return { text, json: null, html: false };
  try {
    return { text, json: JSON.parse(text), html: false };
  } catch {
    return { text, json: null, html: false };
  }
}

function errorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === 'object' && 'detail' in json) {
    const detail = (json as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function apiUrl(path: string): string {
  const base = activeBase ?? candidateBases()[0] ?? '/api';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<{ res: Response; json: unknown | null; text: string }> {
  const bases = activeBase ? [activeBase, ...candidateBases().filter((b) => b !== activeBase)] : candidateBases();
  let lastError = 'Backend unreachable';

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, init);
      const parsed = await parseBody(res);
      if (parsed.html) {
        lastError = `API at ${base} returned HTML instead of JSON`;
        continue;
      }
      if (!res.ok) {
        lastError = errorMessage(parsed.json, res.statusText || `HTTP ${res.status}`);
        if (res.status >= 500) continue;
        throw new Error(lastError);
      }
      activeBase = base;
      return { res, json: parsed.json, text: parsed.text };
    } catch (err) {
      if (err instanceof TypeError) {
        lastError = `Cannot reach ${base}`;
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `${lastError}. Start FastAPI on port 8000 — the UI retries /api then http://127.0.0.1:8000/api.`,
  );
}

async function getJson<T>(path: string): Promise<T> {
  const { json } = await apiFetch(path);
  if (json == null) throw new Error('Empty API response');
  return json as T;
}

export async function ingestRawEmail(rawSource: string): Promise<{
  status: string;
  case_id: string;
  message: string;
}> {
  const body = new FormData();
  body.append('raw_source', rawSource);
  const { json } = await apiFetch('/ingest', { method: 'POST', body });
  return json as { status: string; case_id: string; message: string };
}

export async function ingestEmailFile(file: File): Promise<{
  status: string;
  case_id: string;
  message: string;
}> {
  const body = new FormData();
  body.append('file', file);
  const { json } = await apiFetch('/ingest', { method: 'POST', body });
  return json as { status: string; case_id: string; message: string };
}

export async function listCases(): Promise<{ cases: CaseSummary[]; total: number }> {
  return getJson('/cases');
}

export async function getCase(caseId: string): Promise<CaseDetailData> {
  return getJson(`/cases/${caseId}`);
}

export async function reviewCase(caseId: string) {
  const { json } = await apiFetch(`/cases/${caseId}/review`, { method: 'POST' });
  return json;
}

export async function escalateCase(caseId: string) {
  const { json } = await apiFetch(`/cases/${caseId}/escalate`, { method: 'POST' });
  return json;
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
  return apiUrl(`/cases/${caseId}/report.pdf`);
}

export function certificatePdfUrl(caseId: string) {
  return apiUrl(`/cases/${caseId}/certificate.pdf`);
}

export async function healthCheck(): Promise<{ status: string }> {
  const bases = ['/health', 'http://127.0.0.1:8000/health', 'http://localhost:8000/health'];
  for (const url of bases) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (isHtmlPayload(text, res) || !res.ok) continue;
      return JSON.parse(text) as { status: string };
    } catch {
      continue;
    }
  }
  throw new Error('Backend offline');
}
