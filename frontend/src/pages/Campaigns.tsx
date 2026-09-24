import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCampaigns } from '../api/client';
import type { Campaign, CampaignGraph } from '../types';

/* ─────────── Force-directed layout ─────────── */

interface LayoutNode {
  id: string;
  subject?: string;
  verdict?: string;
  val?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LayoutLink {
  source: string;
  target: string;
  strength: number;
  shared?: string[];
}

function initLayout(
  graph: CampaignGraph,
  width: number,
  height: number,
): { nodes: LayoutNode[]; links: LayoutLink[] } {
  const cx = width / 2;
  const cy = height / 2;
  const nodes: LayoutNode[] = graph.nodes.map((n, i) => {
    const angle = (i / Math.max(graph.nodes.length, 1)) * Math.PI * 2;
    const r = 80 + Math.random() * 60;
    return {
      id: n.id,
      subject: n.subject,
      verdict: n.verdict,
      val: n.val ?? 8,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    };
  });
  const links: LayoutLink[] = graph.links.map((l) => ({
    source: String(l.source),
    target: String(l.target),
    strength: l.strength ?? 1,
    shared: l.shared,
  }));
  return { nodes, links };
}

function simulate(
  nodes: LayoutNode[],
  links: LayoutLink[],
  width: number,
  height: number,
  iterations: number = 120,
) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const cx = width / 2;
  const cy = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const cooling = alpha * 0.6;

    // Repulsive force between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (800 / (dist * dist)) * cooling;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        nodes[i].vx -= dx;
        nodes[i].vy -= dy;
        nodes[j].vx += dx;
        nodes[j].vy += dy;
      }
    }

    // Attractive force along links
    for (const link of links) {
      const src = byId.get(link.source);
      const tgt = byId.get(link.target);
      if (!src || !tgt) continue;
      let dx = tgt.x - src.x;
      let dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 100) * 0.005 * cooling * link.strength;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      src.vx += dx;
      src.vy += dy;
      tgt.vx -= dx;
      tgt.vy -= dy;
    }

    // Gravity toward center
    for (const node of nodes) {
      node.vx += (cx - node.x) * 0.002 * cooling;
      node.vy += (cy - node.y) * 0.002 * cooling;
    }

    // Apply velocities with damping
    for (const node of nodes) {
      node.vx *= 0.6;
      node.vy *= 0.6;
      node.x += node.vx;
      node.y += node.vy;
      // Clamp to bounds with padding
      node.x = Math.max(40, Math.min(width - 40, node.x));
      node.y = Math.max(30, Math.min(height - 30, node.y));
    }
  }
}

/* ─────────── Colors ─────────── */
function nodeColor(verdict?: string): string {
  switch (verdict) {
    case 'BEC':
      return '#f59e0b';
    case 'Phishing':
      return '#ef4444';
    case 'Novel':
      return '#a855f7';
    default:
      return '#22d3ee';
  }
}

function nodeGlow(verdict?: string): string {
  switch (verdict) {
    case 'BEC':
      return 'rgba(245, 158, 11, 0.5)';
    case 'Phishing':
      return 'rgba(239, 68, 68, 0.5)';
    case 'Novel':
      return 'rgba(168, 85, 247, 0.5)';
    default:
      return 'rgba(34, 211, 238, 0.5)';
  }
}

function threatBadge(level?: string): string {
  switch (level) {
    case 'Critical':
      return 'badge-critical';
    case 'High':
      return 'badge-high';
    case 'Medium':
      return 'badge-medium';
    default:
      return 'badge-low';
  }
}

/* ─────────── Component ─────────── */

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [graph, setGraph] = useState<CampaignGraph>({ nodes: [], links: [] });
  const [active, setActive] = useState<Campaign | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

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
    // Stagger mount animation
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const W = 560;
  const H = 420;

  const layout = useMemo(() => {
    if (graph.nodes.length === 0) return { nodes: [] as LayoutNode[], links: [] as LayoutLink[] };
    const { nodes, links } = initLayout(graph, W, H);
    simulate(nodes, links, W, H);
    return { nodes, links };
  }, [graph]);

  const byId = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes],
  );

  // Determine which links connect to hovered node
  const connectedLinks = useMemo(() => {
    if (!hoveredNode) return new Set<number>();
    const s = new Set<number>();
    layout.links.forEach((l, i) => {
      if (l.source === hoveredNode || l.target === hoveredNode) s.add(i);
    });
    return s;
  }, [hoveredNode, layout.links]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const s = new Set<string>([hoveredNode]);
    layout.links.forEach((l) => {
      if (l.source === hoveredNode) s.add(l.target);
      if (l.target === hoveredNode) s.add(l.source);
    });
    return s;
  }, [hoveredNode, layout.links]);

  return (
    <div
      className="space-y-5"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">Campaign Graph</h1>
        <p className="text-sm text-text-secondary">
          Shared ASN, sender domain, and URL clustering across threat cases.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Clusters" value={campaigns.length} delay={0.1} />
        <StatCard label="Graph nodes" value={graph.nodes.length} delay={0.18} />
        <StatCard label="Shared-indicator links" value={graph.links.length} delay={0.26} />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Graph SVG */}
        <div className="card overflow-hidden p-0 relative group">
          {graph.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-[360px] lg:h-[420px]" style={{ background: 'var(--map-bg)' }}>
              <div className="text-center space-y-3 px-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-cyan-500/10 grid place-items-center">
                  <svg className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="4" cy="6" r="2" />
                    <circle cx="20" cy="6" r="2" />
                    <circle cx="4" cy="18" r="2" />
                    <circle cx="20" cy="18" r="2" />
                    <line x1="6" y1="6" x2="9.5" y2="10" />
                    <line x1="18" y1="6" x2="14.5" y2="10" />
                    <line x1="6" y1="18" x2="9.5" y2="14" />
                    <line x1="18" y1="18" x2="14.5" y2="14" />
                  </svg>
                </div>
                <p className="text-sm text-text-muted">
                  Campaign clusters form after multiple threat emails share infrastructure.
                </p>
                <p className="text-xs text-text-muted/70">
                  Ingest phishing or BEC emails to see connections.
                </p>
              </div>
            </div>
          ) : (
            <>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="h-[360px] w-full text-text-secondary lg:h-[420px]"
                style={{ background: 'var(--map-bg)' }}
              >
                {/* Grid background */}
                <defs>
                  <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.04)" strokeWidth="0.5" />
                  </pattern>
                  <radialGradient id="graph-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(6,182,212,0.08)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  {/* Node glow filters */}
                  <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect width={W} height={H} fill="url(#graph-grid)" />
                <rect width={W} height={H} fill="url(#graph-glow)" />

                {/* Links */}
                {layout.links.map((link, i) => {
                  const s = byId.get(link.source);
                  const t = byId.get(link.target);
                  if (!s || !t) return null;
                  const isHighlighted = connectedLinks.has(i);
                  const isDimmed = hoveredNode !== null && !isHighlighted;
                  const isLinkHovered = hoveredLink === i;
                  return (
                    <g key={i}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={isHighlighted || isLinkHovered ? 'rgba(34,211,238,0.8)' : 'rgba(34,211,238,0.25)'}
                        strokeWidth={isHighlighted || isLinkHovered ? link.strength * 1.5 + 1 : link.strength}
                        strokeDasharray={link.strength <= 1 ? '4 3' : undefined}
                        style={{
                          opacity: isDimmed ? 0.15 : 1,
                          transition: 'opacity 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease',
                        }}
                        onMouseEnter={() => setHoveredLink(i)}
                        onMouseLeave={() => setHoveredLink(null)}
                      />
                      {/* Shared indicator count on link midpoint */}
                      {(isHighlighted || isLinkHovered) && link.shared && link.shared.length > 0 && (
                        <g style={{ opacity: 1, transition: 'opacity 0.2s ease' }}>
                          <circle
                            cx={(s.x + t.x) / 2}
                            cy={(s.y + t.y) / 2}
                            r="10"
                            fill="rgba(14,26,46,0.9)"
                            stroke="rgba(34,211,238,0.5)"
                            strokeWidth="1"
                          />
                          <text
                            x={(s.x + t.x) / 2}
                            y={(s.y + t.y) / 2 + 3.5}
                            textAnchor="middle"
                            fill="#22d3ee"
                            fontSize="9"
                            fontWeight="600"
                          >
                            {link.shared.length}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {layout.nodes.map((n) => {
                  const r = Math.max(7, (n.val ?? 8) / 2);
                  const color = nodeColor(n.verdict);
                  const isActive = hoveredNode === n.id;
                  const isDimmed = hoveredNode !== null && !connectedNodes.has(n.id);
                  return (
                    <g
                      key={n.id}
                      style={{
                        opacity: isDimmed ? 0.2 : 1,
                        transition: 'opacity 0.3s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredNode(n.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Glow ring on hover */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={isActive ? r + 8 : r + 3}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        style={{
                          opacity: isActive ? 0.4 : 0,
                          transition: 'opacity 0.3s ease, r 0.3s ease',
                        }}
                      />
                      {/* Pulse ring (always subtle) */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={r + 2}
                        fill={nodeGlow(n.verdict)}
                        style={{ opacity: 0.15 }}
                      >
                        <animate attributeName="r" from={r + 2} to={r + 12} dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.15" to="0" dur="3s" repeatCount="indefinite" />
                      </circle>
                      {/* Main node */}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={isActive ? r + 2 : r}
                        fill={color}
                        style={{
                          filter: isActive ? 'url(#glow-cyan)' : undefined,
                          transition: 'r 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                      />
                      {/* Label */}
                      <text
                        x={n.x + r + 6}
                        y={n.y + 4}
                        fill="currentColor"
                        fontSize="10"
                        style={{
                          opacity: isActive || !hoveredNode ? 0.85 : 0.25,
                          transition: 'opacity 0.3s ease',
                          fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                      >
                        {(n.subject || n.id).slice(0, 24)}
                      </text>
                    </g>
                  );
                })}

                {/* Hovered link tooltip */}
                {hoveredLink !== null && (() => {
                  const link = layout.links[hoveredLink];
                  if (!link?.shared?.length) return null;
                  const s = byId.get(link.source);
                  const t = byId.get(link.target);
                  if (!s || !t) return null;
                  const mx = (s.x + t.x) / 2;
                  const my = (s.y + t.y) / 2 - 20;
                  return (
                    <g>
                      <rect
                        x={mx - 80}
                        y={my - 8 - link.shared.length * 12}
                        width="160"
                        height={link.shared.length * 12 + 8}
                        rx="6"
                        fill="rgba(14,26,46,0.95)"
                        stroke="rgba(34,211,238,0.3)"
                        strokeWidth="1"
                      />
                      {link.shared.map((s, si) => (
                        <text
                          key={si}
                          x={mx}
                          y={my - link.shared!.length * 12 + si * 12 + 8}
                          textAnchor="middle"
                          fill="#9ab0d6"
                          fontSize="9"
                        >
                          {s}
                        </text>
                      ))}
                    </g>
                  );
                })()}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-bg-secondary/80 backdrop-blur-md px-3 py-1.5 border border-white/5 text-[10px] text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Phishing
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> BEC
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-500" /> Novel
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" /> Other
                </span>
              </div>
            </>
          )}
        </div>

        {/* Sidebar: Campaign list */}
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c)}
              className={`card w-full py-4 text-left transition-all duration-200 ${
                active?.id === c.id
                  ? 'border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.12)]'
                  : 'hover:border-white/15 hover:translate-y-[-1px]'
              }`}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 0.4s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.06}s, transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.06}s, border-color 0.2s ease, box-shadow 0.2s ease`,
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">{c.name}</p>
                <span className={threatBadge(c.threat_level)}>{c.threat_level}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                {c.email_count} emails · {c.unique_senders} senders
              </p>
              {c.first_seen && (
                <p className="mt-1 text-[11px] text-text-muted/70">
                  {c.first_seen} → {c.last_seen}
                </p>
              )}
              {/* Verdict breakdown mini-bar */}
              {c.verdicts && Object.keys(c.verdicts).length > 0 && (
                <div className="mt-2 flex gap-1">
                  {Object.entries(c.verdicts).map(([v, count]) => (
                    <span
                      key={v}
                      className="rounded-md px-1.5 py-0.5 text-[10px]"
                      style={{
                        background:
                          v === 'BEC'
                            ? 'rgba(245,158,11,0.12)'
                            : v === 'Phishing'
                              ? 'rgba(239,68,68,0.12)'
                              : v === 'Novel'
                                ? 'rgba(168,85,247,0.12)'
                                : 'rgba(34,211,238,0.1)',
                        color:
                          v === 'BEC'
                            ? '#fbbf24'
                            : v === 'Phishing'
                              ? '#f87171'
                              : v === 'Novel'
                                ? '#c084fc'
                                : '#22d3ee',
                      }}
                    >
                      {v} {count}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}

          {campaigns.length === 0 && (
            <p className="text-sm text-text-muted">
              Cluster forms after multiple phishing/BEC ingestions share infrastructure.
            </p>
          )}

          {active && active.cases && active.cases.length > 0 && (
            <div
              className="card"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1) 0.5s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.5s',
              }}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                Linked cases
              </p>
              <div className="mt-2 space-y-1">
                {active.cases.map((id) => (
                  <Link
                    key={id}
                    to={`/console/cases/${id}`}
                    className="group/link flex items-center gap-2 font-mono text-xs text-cyan-300 rounded-md px-2 py-1 -mx-2 hover:bg-cyan-500/10 transition-colors duration-150"
                  >
                    <span className="h-1 w-1 rounded-full bg-cyan-400 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                    {id.slice(0, 12)}…
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

/* ─────────── Animated stat card ─────────── */

function StatCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let frame = 0;
    const total = 30;
    const step = () => {
      frame++;
      const progress = frame / total;
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (frame < total) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, value]);

  return (
    <div
      ref={ref}
      className="card py-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)`,
      }}
    >
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-display text-3xl tabular-nums">{display}</p>
    </div>
  );
}
