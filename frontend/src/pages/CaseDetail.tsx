import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { downloadCertificatePdf, downloadForensicPdf, escalateCase, getCase, reviewCase } from '../api/client';
import { RiskGauge } from '../components/RiskGauge';
import type { CaseDetailData } from '../types';
import { countryFlag, getVerdictBadge, hopIp, normalizeShap } from '../utils/cn';
import { useAppStore } from '../hooks/useAppStore';

export function CaseDetail() {
  const { id } = useParams();
  const addToast = useAppStore((s) => s.addToast);
  const [data, setData] = useState<CaseDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      setData(await getCase(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Case not found');
    }
  };

  useEffect(() => {
    void load();
    // Reload whenever the route case id changes.
  }, [id]);

  const shap = useMemo(() => normalizeShap(data?.shap_explanation), [data]);
  const body = data?.body_text ?? '';
  const highlighted = highlight
    ? body.replace(
        /(urgent|verify|kyc|password|wire|transfer|click|account|closed|immediately)/gi,
        (m) => `⟦${m}⟧`,
      )
    : body;

  if (error) {
    return <p className="text-sm text-amber-200">Unable to load case: {error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-text-muted">Loading forensic workbench…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-400">Case workbench</p>
          <h1 className="font-display text-2xl font-bold text-text-primary">{data.subject || '(No Subject)'}</h1>
          <p className="mt-1 text-sm text-text-secondary">{data.sender}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary py-2 text-sm"
            onClick={() => {
              void downloadCertificatePdf(data.id).catch((err) =>
                addToast({ type: 'error', title: 'Certificate failed', message: err instanceof Error ? err.message : '' }),
              );
            }}
          >
            BSA §63(4) PDF
          </button>
          <button
            type="button"
            className="btn-primary py-2 text-sm"
            onClick={() => {
              void downloadForensicPdf(data.id).catch((err) =>
                addToast({ type: 'error', title: 'Report failed', message: err instanceof Error ? err.message : '' }),
              );
            }}
          >
            Forensic PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="card grid place-items-center">
          <RiskGauge score={data.risk_score} size={140} />
          <span className={`mt-3 ${getVerdictBadge(data.verdict)}`}>{data.verdict}</span>
          {data.is_novel && <span className="badge-novelty mt-2">Novelty tagged</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AuthBadge label="SPF" value={data.spf_result} />
          <AuthBadge label="DKIM" value={data.dkim_result} />
          <AuthBadge label="DMARC" value={data.dmarc_result} />
          <div className="card py-4 sm:col-span-3">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Origin</p>
            <p className="mt-2 text-text-primary">
              {(() => {
                const hop = (data.geo_hops ?? []).find((h) => h.country && h.country !== 'Private') ?? (data.geo_hops ?? [])[0];
                const country = hop?.country || data.origin_country;
                const city = hop?.city || data.origin_city;
                const asn = hop?.asn || data.origin_asn;
                return `${countryFlag(country)} ${city || '—'}, ${country || 'Unknown'} · ASN ${asn || 'n/a'}`;
              })()}
            </p>
            <p className="mt-1 font-mono text-xs text-text-muted">geo confidence: {data.geo_confidence || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card min-h-[280px]">
          <h2 className="font-display text-lg font-semibold">SHAP why-panel</h2>
          <p className="mb-3 text-xs text-text-muted">Feature contributions from the ensemble</p>
          {shap.length === 0 ? (
            <p className="text-sm text-text-muted">No SHAP payload on this case (ML service may have used fallback scoring).</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shap.slice(0, 8)} layout="vertical" margin={{ left: 16, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#9ab0d6', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0c1427', border: '1px solid rgba(34,211,238,0.2)' }} />
                  <Bar dataKey="value" fill="#22d3ee" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Body & link analysis</h2>
            <button type="button" className="btn-ghost text-xs" onClick={() => setHighlight((v) => !v)}>
              {highlight ? 'Highlights on' : 'Highlights off'}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-cyan-100/80">
            {highlighted || 'No body text'}
          </pre>
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-lg font-semibold">Technical headers</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {Object.entries(data.headers_json ?? {})
            .slice(0, 12)
            .map(([key, value]) => (
              <div key={key} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <p className="text-[11px] uppercase tracking-widest text-text-muted">{key}</p>
                <p className="break-all font-mono text-xs text-text-secondary">{String(value)}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Hop chain</h2>
          <Link to="/console/geo-intel" className="text-sm text-text-accent font-semibold hover:underline">
            Open Geo Forensics →
          </Link>
        </div>
        <div className="space-y-2">
          {(data.geo_hops ?? []).map((hop, i) => (
            <div key={`${hopIp(hop)}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2 text-sm">
              <span className="font-mono text-text-accent font-semibold">{hopIp(hop)}</span>
              <span>{hop.city} {hop.country}</span>
              <span className="text-text-muted">{hop.asn} {hop.org}</span>
              {(hop.is_tor_exit || hop.is_tor) && <span className="badge-novelty">TOR</span>}
              {hop.is_vpn && <span className="badge-high">VPN</span>}
            </div>
          ))}
          {(data.geo_hops ?? []).length === 0 && <p className="text-sm text-text-muted">No hops attributed.</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            try {
              await reviewCase(data.id);
              addToast({ type: 'success', title: 'Marked in review' });
              await load();
            } catch (err) {
              addToast({ type: 'error', title: 'Review failed', message: err instanceof Error ? err.message : '' });
            }
          }}
        >
          Mark reviewed
        </button>
        <button
          type="button"
          className="btn-danger py-2"
          onClick={async () => {
            try {
              await escalateCase(data.id);
              addToast({ type: 'warning', title: 'Case escalated' });
              await load();
            } catch (err) {
              addToast({ type: 'error', title: 'Escalate failed', message: err instanceof Error ? err.message : '' });
            }
          }}
        >
          Escalate
        </button>
        <p className="self-center font-mono text-xs text-text-muted">status: {data.status}</p>
      </div>
    </div>
  );
}

function AuthBadge({ label, value }: { label: string; value?: string }) {
  const v = (value ?? 'NONE').toUpperCase();
  const ok = v === 'PASS';
  return (
    <div className="card py-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${ok ? 'text-emerald-400' : v === 'FAIL' ? 'text-red-400' : 'text-amber-300'}`}>
        {v}
      </p>
    </div>
  );
}
