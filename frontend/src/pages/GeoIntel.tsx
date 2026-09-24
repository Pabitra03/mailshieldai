import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGeo, listCases } from '../api/client';
import type { CaseSummary, GeoHop } from '../types';
import { countryFlag, hopIp } from '../utils/cn';

function project(lat: number, lon: number, w: number, h: number) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

export function GeoIntel() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hops, setHops] = useState<GeoHop[]>([]);
  const [confidence, setConfidence] = useState('—');

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
    void getGeo(selected)
      .then((g) => {
        setHops(g.hops ?? []);
        setConfidence(g.overall_confidence ?? '—');
      })
      .catch(() => {
        setHops([]);
        setConfidence('Unavailable');
      });
  }, [selected]);

  const points = useMemo(() => {
    return hops
      .map((hop) => {
        const lat = hop.latitude;
        const lon = hop.longitude;
        if (lat == null || lon == null) return null;
        return { ...hop, ...project(lat, lon, 900, 420) };
      })
      .filter((p): p is GeoHop & { x: number; y: number } => Boolean(p));
  }, [hops]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Geo Forensics</h1>
        <p className="text-sm text-text-secondary">Dark-world hop vectors, Tor/VPN badges, and confidence fusion.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card max-h-[520px] space-y-2 overflow-auto p-3">
          {cases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selected === c.id ? 'bg-cyan-500/15 text-text-primary' : 'hover:bg-white/5 text-text-secondary'}`}
            >
              <p className="truncate">{c.subject || c.id.slice(0, 8)}</p>
              <p className="text-xs text-text-muted">
                {countryFlag(c.origin_country)} {c.origin_country || 'Unknown'}
              </p>
            </button>
          ))}
          {cases.length === 0 && <p className="p-3 text-sm text-text-muted">Ingest a case to trace hops.</p>}
        </div>
        <div className="card overflow-hidden p-0">
          <svg viewBox="0 0 900 420" className="h-[320px] w-full text-text-primary lg:h-[420px]" style={{ background: 'var(--map-bg)' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`v${i}`} x1={(i * 900) / 12} y1="0" x2={(i * 900) / 12} y2="420" stroke="rgba(34,211,238,0.08)" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={(i * 420) / 8} x2="900" y2={(i * 420) / 8} stroke="rgba(34,211,238,0.08)" />
            ))}
            {points.map((p, i) => {
              const next = points[i + 1];
              if (!next) return null;
              const cx = (p.x + next.x) / 2;
              const cy = Math.min(p.y, next.y) - 40;
              return <path key={`l${i}`} d={`M ${p.x} ${p.y} Q ${cx} ${cy} ${next.x} ${next.y}`} fill="none" stroke="#22d3ee" strokeWidth="2" />;
            })}
            {points.map((p, i) => (
              <g key={`${hopIp(p)}-${i}`}>
                <circle cx={p.x} cy={p.y} r="7" fill={p.is_tor_exit || p.is_tor ? '#a855f7' : p.is_vpn ? '#f59e0b' : '#ef4444'} />
                <text x={p.x + 10} y={p.y - 8} fill="currentColor" fontSize="11">
                  {p.city || p.country}
                </text>
              </g>
            ))}
          </svg>
          <div className="space-y-2 border-t border-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Confidence fusion · {confidence}</p>
            {hops.map((hop, i) => (
              <div key={`${hopIp(hop)}-${i}`} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/5 px-3 py-2 text-sm">
                <span className="font-mono text-text-accent">#{hop.hop_index ?? i}</span>
                <span>{hopIp(hop)}</span>
                <span>{hop.hostname}</span>
                <span>{hop.country}</span>
                {(hop.is_tor_exit || hop.is_tor) && <span className="badge-novelty">TOR</span>}
                {hop.is_vpn && <span className="badge-high">VPN</span>}
                {hop.is_forged && <span className="badge-critical">FORGED</span>}
              </div>
            ))}
            {selected && (
              <Link to={`/console/cases/${selected}`} className="inline-block text-sm text-text-accent font-semibold hover:underline">
                Open case workbench →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
