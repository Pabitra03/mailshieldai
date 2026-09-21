import { useEffect, useState } from 'react';
import { certificatePdfUrl, listCases, listReports, reportPdfUrl } from '../api/client';
import type { CaseSummary, ReportRecord } from '../types';
import { formatDate, getVerdictBadge } from '../utils/cn';

export function Reports() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRecord[]>([]);

  const refreshReports = () => {
    void listReports()
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]));
  };

  useEffect(() => {
    void listCases()
      .then((d) => {
        setCases(d.cases);
        if (d.cases[0]) setSelected(d.cases[0].id);
      })
      .catch(() => setCases([]));
    refreshReports();
  }, []);

  const current = cases.find((c) => c.id === selected);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports Studio</h1>
        <p className="text-sm text-text-secondary">One-click BSA 2023 §63(4) certificates and forensic investigation PDFs.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card max-h-[480px] space-y-2 overflow-auto p-3">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selected === c.id ? 'bg-cyan-500/15 text-text-primary' : 'text-text-secondary hover:bg-white/5'}`}
            >
              <p className="truncate">{c.subject || '(No Subject)'}</p>
              <p className="text-xs text-text-muted">{c.verdict} · {(c.risk_score ?? 0).toFixed(1)}</p>
            </button>
          ))}
        </div>
        <div className="card">
          {current ? (
            <>
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Live preview</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{current.subject}</h2>
              <p className="mt-1 text-sm text-text-secondary">{current.sender}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={getVerdictBadge(current.verdict)}>{current.verdict}</span>
                <span className="stat-pill">risk {current.risk_score ?? 0}</span>
                <span className="stat-pill">{current.origin_country || 'origin n/a'}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="btn-primary" href={certificatePdfUrl(current.id)} onClick={() => window.setTimeout(refreshReports, 800)}>
                  Download BSA §63(4)
                </a>
                <a className="btn-secondary" href={reportPdfUrl(current.id)} onClick={() => window.setTimeout(refreshReports, 800)}>
                  Download Forensic Report
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">Select a sealed case to generate court-ready PDFs.</p>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-text-muted">Recent report audit log</div>
        <div className="divide-y divide-white/5">
          {reports.length === 0 && <p className="px-4 py-6 text-sm text-text-muted">No PDFs generated in this backend session yet.</p>}
          {reports.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="text-text-primary">{r.filename}</p>
                <p className="text-xs text-text-muted">
                  {r.report_type} · {formatDate(r.generated_at)} · {r.subject}
                </p>
              </div>
              <a className="text-cyan-300" href={r.download_url || reportPdfUrl(r.case_id)}>
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
