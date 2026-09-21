import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock3, Radio, Sparkles } from 'lucide-react';
import { listCases } from '../api/client';
import { RiskGauge } from '../components/RiskGauge';
import type { CaseSummary } from '../types';
import { countryFlag, formatTime, getRiskBar, getVerdictBadge } from '../utils/cn';
import { useAppStore } from '../hooks/useAppStore';

const FILTERS = ['All Cases', 'High Threat', 'Phishing', 'BEC', 'Novel Outliers'] as const;

export function LiveFeed() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All Cases');
  const [error, setError] = useState<string | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const load = async () => {
    try {
      const data = await listCases();
      setCases(data.cases);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load cases';
      setError(message);
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, []);

  const metrics = useMemo(() => {
    const high = cases.filter((c) => (c.risk_score ?? 0) > 60).length;
    const novel = cases.filter((c) => c.is_novel).length;
    const avg =
      cases.length === 0
        ? 0
        : cases.reduce((sum, c) => sum + (c.detection_time_ms ?? 0), 0) / cases.length;
    return { total: cases.length, high, novel, avg };
  }, [cases]);

  const visible = cases.filter((c) => {
    const hay = `${c.sender} ${c.subject} ${c.origin_country ?? ''}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (filter === 'High Threat') return (c.risk_score ?? 0) > 60;
    if (filter === 'Phishing') return (c.verdict ?? '').toLowerCase().includes('phish');
    if (filter === 'BEC') return (c.verdict ?? '').toLowerCase().includes('bec');
    if (filter === 'Novel Outliers') return Boolean(c.is_novel);
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
          <Radio className="h-5 w-5 text-cyan-400" /> Live Threat Feed
        </h1>
        <p className="text-sm text-text-secondary">Real-time telemetry from RFC 822 ingestion and forensic inference.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Threats Analyzed" value={String(metrics.total)} hint="Sealed in Merkle tree" icon={<Radio className="h-4 w-4 text-cyan-400" />} />
        <Metric label="High-Risk Intercepted" value={String(metrics.high)} hint="Risk score > 60/100" icon={<AlertTriangle className="h-4 w-4 text-red-400" />} />
        <Metric label="Novel Anomalies" value={String(metrics.novel)} hint="Isolation Forest flagged" icon={<Sparkles className="h-4 w-4 text-violet-400" />} />
        <Metric label="Pipeline Latency" value={`${(metrics.avg / 1000).toFixed(1)}s`} hint="Parallel 5-model ensemble" icon={<Clock3 className="h-4 w-4 text-emerald-400" />} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by sender, subject, or origin country…"
          className="input-field"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={item === filter ? 'btn-primary py-2 px-3 text-xs' : 'btn-ghost border border-white/10 text-xs'}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Backend unreachable ({error}). Start FastAPI on port 8000 to ingest live cases.
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => {
              void load();
              addToast({ type: 'info', title: 'Retrying case feed' });
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="hidden grid-cols-[70px_1.2fr_1.5fr_140px_120px_120px_90px_90px] bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-text-muted xl:grid">
          <span>Time</span>
          <span>Sender</span>
          <span>Subject</span>
          <span>Risk</span>
          <span>Verdict</span>
          <span>Origin</span>
          <span>Latency</span>
          <span>Action</span>
        </div>
        <div className="divide-y divide-white/5">
          {visible.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-text-muted">No cases yet. Upload an .eml or fire a sandbox preset.</p>
          )}
          {visible.map((item) => (
            <Link
              key={item.id}
              to={`/console/cases/${item.id}`}
              className="grid grid-cols-1 gap-2 px-4 py-3 text-sm hover:bg-white/[0.04] xl:grid-cols-[70px_1.2fr_1.5fr_140px_120px_120px_90px_90px] xl:items-center"
            >
              <span className="font-mono text-xs text-text-muted">{formatTime(item.created_at)}</span>
              <span className="truncate text-cyan-100">{item.sender || 'unknown'}</span>
              <span className="flex items-center gap-2 truncate text-text-secondary">
                {item.subject || '(No Subject)'}
                {item.is_novel && <span className="badge-novelty">Novel</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-16 font-mono text-xs">{(item.risk_score ?? 0).toFixed(1)}</span>
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                  <span className={`block h-full ${getRiskBar(item.risk_score)}`} style={{ width: `${item.risk_score ?? 0}%` }} />
                </span>
              </span>
              <span className={getVerdictBadge(item.verdict)}>{item.verdict ?? '—'}</span>
              <span className="text-text-secondary">
                {countryFlag(item.origin_country)} {item.origin_country || 'Unknown'}
              </span>
              <span className="font-mono text-xs text-text-muted">{item.detection_time_ms ? `${Math.round(item.detection_time_ms)}ms` : '—'}</span>
              <span className="text-cyan-300">Inspect →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="card py-4">
      <div className="flex items-center justify-between text-text-muted">
        <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
        {icon}
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}

export function Overview() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  useEffect(() => {
    void listCases()
      .then((d) => setCases(d.cases))
      .catch(() => setCases([]));
  }, []);
  const latest = cases[0];
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">SOC Overview</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="card">
          <p className="text-sm text-text-secondary">
            MailShieldAI is ingesting RFC 822 mail through FastAPI, scoring with the 5-engine ensemble, attributing hops, and sealing a Merkle ledger.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-text-muted">Latest sealed case</p>
          {latest ? (
            <Link to={`/console/cases/${latest.id}`} className="mt-2 block text-cyan-300">
              {latest.subject || latest.id} · {latest.verdict} · {(latest.risk_score ?? 0).toFixed(1)}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-text-muted">No cases in memory yet.</p>
          )}
        </div>
        <div className="card grid place-items-center">
          <RiskGauge score={latest?.risk_score ?? 0} />
        </div>
      </div>
    </div>
  );
}
