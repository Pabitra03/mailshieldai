import { useEffect, useState } from 'react';
import { getEvidence, listCases } from '../api/client';
import type { CaseSummary, EvidencePayload } from '../types';
import { truncateHash } from '../utils/cn';
import { useAppStore } from '../hooks/useAppStore';

export function Evidence() {
  const addToast = useAppStore((s) => s.addToast);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidencePayload | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    void listCases()
      .then((d) => {
        setCases(d.cases);
        if (d.cases[0]) setSelected(d.cases[0].id);
      })
      .catch(() => setCases([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    void getEvidence(selected)
      .then(setEvidence)
      .catch(() => setEvidence(null));
  }, [selected]);

  const copy = async (value?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    addToast({ type: 'success', title: 'Hash copied' });
  };

  const leaves = evidence?.artifacts ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Evidence Vault</h1>
        <p className="text-sm text-text-secondary">Cryptographic chain ledger, Merkle visualization, and sealed artifacts.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card max-h-[560px] space-y-2 overflow-auto p-3">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selected === c.id ? 'bg-cyan-500/15 text-text-primary' : 'text-text-secondary hover:bg-white/5'}`}
            >
              <p className="truncate">{c.subject || c.id.slice(0, 8)}</p>
              <p className="font-mono text-[11px] text-text-muted">{c.id.slice(0, 12)}</p>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <div className={`card ${pulse ? 'animate-glow-pulse' : ''}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Merkle root</h2>
              <button
                type="button"
                className="btn-secondary py-1.5 text-xs"
                onClick={() => {
                  setPulse(true);
                  window.setTimeout(() => setPulse(false), 1600);
                }}
              >
                Verify pulse
              </button>
            </div>
            <p className="hash-text text-text-accent font-semibold">{evidence?.merkle_root || 'No seal yet'}</p>
            <p className="mt-2 text-xs text-text-muted">chain_verified: {String(evidence?.chain_verified ?? false)}</p>
            <svg viewBox="0 0 520 180" className="mt-4 w-full">
              <rect x="200" y="12" width="120" height="36" rx="8" fill="#0f1d38" stroke="#22d3ee" />
              <text x="260" y="35" textAnchor="middle" fill="#22d3ee" fontSize="11">ROOT</text>
              {leaves.map((leaf, i) => {
                const x = 40 + i * 160;
                return (
                  <g key={leaf.name}>
                    <line x1="260" y1="48" x2={x + 50} y2="90" stroke="rgba(34,211,238,0.4)" />
                    <rect x={x} y="90" width="100" height="54" rx="8" fill="#0c1427" stroke="#10b981" />
                    <text x={x + 50} y="112" textAnchor="middle" fill="#9ab0d6" fontSize="9">
                      {leaf.type || 'leaf'}
                    </text>
                    <text x={x + 50} y="128" textAnchor="middle" fill="#34d399" fontSize="8">
                      {truncateHash(leaf.sha256, 10)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="card">
            <h2 className="font-display text-lg font-semibold">Hash chain</h2>
            <div className="mt-3 space-y-2">
              {(evidence?.ledger_entries ?? []).map((entry, i) => (
                <div key={`${entry.entry_hash}-${i}`} className="rounded-xl border border-white/5 px-3 py-2">
                  <p className="text-xs uppercase text-text-muted">{entry.payload_type}</p>
                  <button type="button" className="hash-text text-left text-cyan-200" onClick={() => copy(entry.entry_hash)}>
                    entry {truncateHash(entry.entry_hash, 24)}
                  </button>
                  <p className="hash-text">prev {truncateHash(entry.previous_hash, 24)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.14em] text-text-muted">
                <tr>
                  <th className="px-3 py-2">Artifact</th>
                  <th className="px-3 py-2">SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {(evidence?.artifacts ?? []).map((a) => (
                  <tr key={a.name} className="border-t border-white/5">
                    <td className="px-3 py-2">{a.name}</td>
                    <td className="px-3 py-2">
                      <button type="button" className="hash-text text-text-accent font-semibold hover:underline" onClick={() => copy(a.sha256)}>
                        {a.sha256}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
