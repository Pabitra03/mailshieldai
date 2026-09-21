import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCampaigns } from '../api/client';
import type { Campaign, CampaignGraph } from '../types';

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [graph, setGraph] = useState<CampaignGraph>({ nodes: [], links: [] });
  const [active, setActive] = useState<Campaign | null>(null);

  useEffect(() => {
    void listCampaigns()
      .then((d) => {
        setCampaigns(d.campaigns ?? []);
        setGraph(d.graph ?? { nodes: [], links: [] });
        setActive(d.campaigns?.[0] ?? null);
      })
      .catch(() => {
        setCampaigns([]);
      });
  }, []);

  const layout = useMemo(() => {
    const nodes = graph.nodes.map((n, i) => {
      const angle = (i / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
      return {
        ...n,
        x: 280 + Math.cos(angle) * (120 + (n.val ?? 8) * 3),
        y: 210 + Math.sin(angle) * (90 + (n.val ?? 8) * 2),
      };
    });
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    return { nodes, byId };
  }, [graph]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Campaign Graph</h1>
        <p className="text-sm text-text-secondary">Shared ASN, sender domain, and URL clustering across threat cases.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card py-4">
          <p className="text-xs text-text-muted">Clusters</p>
          <p className="font-display text-3xl">{campaigns.length}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-text-muted">Graph nodes</p>
          <p className="font-display text-3xl">{graph.nodes.length}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-text-muted">Shared-indicator links</p>
          <p className="font-display text-3xl">{graph.links.length}</p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden p-0">
          <svg viewBox="0 0 560 420" className="h-[360px] w-full bg-[#07111f] lg:h-[420px]">
            {graph.links.map((link, i) => {
              const s = layout.byId[String(link.source)];
              const t = layout.byId[String(link.target)];
              if (!s || !t) return null;
              return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="rgba(34,211,238,0.45)" strokeWidth={link.strength ?? 1} />;
            })}
            {layout.nodes.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={Math.max(6, (n.val ?? 8) / 2)} fill={n.verdict === 'BEC' ? '#f59e0b' : n.verdict === 'Phishing' ? '#ef4444' : '#22d3ee'} />
                <text x={n.x + 10} y={n.y + 4} fill="#9ab0d6" fontSize="10">
                  {(n.subject || n.id).slice(0, 22)}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="space-y-3">
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c)}
              className={`card w-full py-4 text-left ${active?.id === c.id ? 'border-cyan-400/40' : ''}`}
            >
              <p className="font-display font-semibold">{c.name}</p>
              <p className="text-xs text-text-muted">
                {c.threat_level} · {c.email_count} emails · {c.unique_senders} senders
              </p>
            </button>
          ))}
          {campaigns.length === 0 && <p className="text-sm text-text-muted">Cluster forms after multiple phishing/BEC ingestions share infrastructure.</p>}
          {active && (
            <div className="card">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Linked cases</p>
              <div className="mt-2 space-y-1">
                {(active.cases ?? []).map((id) => (
                  <Link key={id} to={`/console/cases/${id}`} className="block font-mono text-xs text-cyan-300">
                    {id.slice(0, 8)}…
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
