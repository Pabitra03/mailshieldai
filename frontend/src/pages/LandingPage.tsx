import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  Fingerprint,
  Globe2,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
} from 'lucide-react';
import { EMAIL_PRESETS, PIPELINE_STAGES, type PresetKey } from '../data/presets';
import { useAppStore } from '../hooks/useAppStore';
import { cn } from '../utils/cn';
import { ThemeToggle } from '../components/ThemeToggle';
import { RiskGauge } from '../components/RiskGauge';

const ENGINES = [
  {
    name: 'LightGBM Header Forensics',
    detail: 'Learns SPF/DKIM/DMARC failures, Received-path entropy, and look-alike From domains.',
    color: 'cyan',
  },
  {
    name: 'TF-IDF Phishing Intent',
    detail: 'Classifies urgency, credential harvest, and brand impersonation language.',
    color: 'emerald',
  },
  {
    name: 'URL Entropy Scorer',
    detail: 'Flags homoglyphs, IP hosts, shortening services, and high-entropy paths.',
    color: 'amber',
  },
  {
    name: 'Perceptual Brand Matcher',
    detail: 'Detects logo/brand collisions even when sender domains are not exact matches.',
    color: 'violet',
  },
  {
    name: 'Isolation Forest Novelty',
    detail: 'Surfaces zero-day campaigns that sit outside historical phishing manifolds.',
    color: 'crimson',
  },
];

const BSA = [
  { title: 'SHA-256 Merkle seals', body: 'Every raw .eml, verdict JSON, and geo hop list is hashed into a Merkle root.' },
  { title: 'WORM custody chain', body: 'Ledger entries bind payload_hash → previous_hash so tampering breaks verification.' },
  { title: '§63(4) certificates', body: 'Court-ready PDFs generated from sealed artifacts with analyst-exportable hashes.' },
  { title: 'Forensic reports', body: 'Full hop, SHAP, and authentication narrative suitable for CERT-In / LEA handoff.' },
];

export function LandingPage() {
  const openUpload = useAppStore((s) => s.openUpload);
  const [preset, setPreset] = useState<PresetKey>('hdfc');
  const [stage, setStage] = useState(6);
  const [scanning, setScanning] = useState(true);
  const scenario = EMAIL_PRESETS[preset];

  useEffect(() => {
    if (!scanning) return undefined;
    setStage(1);
    const id = window.setInterval(() => {
      setStage((s) => (s >= 7 ? 7 : s + 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [preset, scanning]);

  useEffect(() => {
    if (stage >= 7) setScanning(false);
  }, [stage]);

  const metrics = useMemo(
    () => [
      { label: 'Latency', value: '342ms' },
      { label: 'Stage', value: `${Math.min(stage, 7)}/7` },
      { label: 'Hops', value: '6 identified' },
    ],
    [stage],
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary bg-grid-pattern">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
      <header className="sticky top-4 z-40 mx-auto flex w-[min(1180px,calc(100%-1.5rem))] items-center justify-between gap-3 rounded-full border border-white/10 bg-bg-secondary/80 px-3 py-2 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 pl-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-700">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold whitespace-nowrap">MailShieldAI</span>
          <span className="hidden rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-300 lg:inline">SIH26106</span>
        </Link>
        <nav className="hidden min-w-0 items-center gap-4 overflow-x-auto text-sm text-text-secondary xl:flex">
          <a href="#sandbox" className="hover:text-text-primary">Threat Sandbox</a>
          <a href="#engines" className="hover:text-text-primary">AI Engines</a>
          <a href="#geo" className="hover:text-text-primary">Geo Forensics</a>
          <a href="#evidence" className="hover:text-text-primary">Evidence</a>
          <a href="#architecture" className="hover:text-text-primary">Architecture</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <button type="button" onClick={openUpload} className="btn-secondary py-2 px-3 text-sm">Upload Email</button>
          <Link to="/console" className="btn-primary py-2 px-4 text-sm">Console</Link>
        </div>
      </header>

      <section className="relative mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-10 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" /> Autonomous Email Security
          </p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] text-text-primary md:text-6xl">
            Detect.
            <br />
            Investigate.
            <br />
            Defend.
          </h1>
          <p className="mt-5 text-xl text-cyan-300">Advanced Email Threat Intelligence</p>
          <p className="mt-4 max-w-xl text-text-secondary">
            MailShieldAI analyzes email identity, authentication, network origin, content signals, and threat relationships
            to uncover phishing, BEC, fraud, and suspicious activity — built for SIH 2026 problem statement 26106.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#sandbox" className="btn-primary">Analyze Email</a>
            <Link to="/console" className="btn-secondary inline-flex items-center gap-2">
              Open Threat Console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-xs text-text-muted">
            <span>Zero Data Retention</span>
            <span>SHA-256 Merkle Proven</span>
            <span>Sub-second Latency</span>
          </div>
        </div>

        <div className="card border-cyan-500/20 shadow-glow-cyan">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live Threat Detected
            </p>
            <p className="font-mono text-[11px] text-text-muted">Latency: 342ms · Stage {Math.min(stage, 7)}/7</p>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-text-muted">Risk Score</p>
              <p className="font-display text-5xl font-bold text-red-400">{scenario.risk.toFixed(1)}</p>
              <p className="mt-2 inline-flex rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-300">
                {scenario.tag} // CRITICAL
              </p>
            </div>
            <div className="text-right text-xs text-text-secondary">
              <p>ORIGIN: {scenario.origin}</p>
              <p className="text-red-300">AUTH: SPF FAIL · DKIM FAIL</p>
              <p>NETWORK: 6 Hops Identified</p>
            </div>
          </div>
          <p className="mt-6 mb-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">Automated Analysis Pipeline</p>
          <div className="space-y-2">
            {PIPELINE_STAGES.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3 py-2 text-sm',
                  item.id <= stage ? 'border-cyan-500/20 bg-cyan-500/5 text-text-primary' : 'border-white/5 text-text-muted',
                )}
              >
                <span>{item.name}</span>
                <span className="font-mono text-[11px] text-text-muted">#{item.id}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sandbox" className="mx-auto w-[min(1180px,calc(100%-1.5rem))] pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-400">Interactive Threat Sandbox</p>
        <h2 className="section-title mt-2">Instant scan simulation</h2>
        <p className="section-subtitle">Four preloaded real-world scenarios. HUD animation locally, then one-click ingest into the live backend.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(EMAIL_PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPreset(key);
                setScanning(true);
              }}
              className={cn('card py-4 text-left card-hover', preset === key && 'border-cyan-400/50 shadow-glow-cyan')}
            >
              <p className="font-display font-semibold text-text-primary">{EMAIL_PRESETS[key].label}</p>
              <p className="mt-1 text-xs text-text-muted">{EMAIL_PRESETS[key].tag} · {EMAIL_PRESETS[key].origin}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <pre className="card max-h-80 overflow-auto font-mono text-xs text-cyan-100/80">{scenario.raw}</pre>
          <div className="card flex flex-col items-center justify-center gap-4">
            <RiskGauge score={scenario.risk} size={120} />
            <div className="w-full space-y-2 text-xs text-text-secondary">
              {metrics.map((m) => (
                <div key={m.label} className="flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-mono text-cyan-300">{m.value}</span>
                </div>
              ))}
            </div>
            <button type="button" className="btn-primary w-full" onClick={openUpload}>
              Send to Analyst Console
            </button>
          </div>
        </div>
      </section>

      <section id="engines" className="mx-auto w-[min(1180px,calc(100%-1.5rem))] pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-400">5-Engine ML Architecture</p>
        <h2 className="section-title mt-2">Ensemble that explains itself</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ENGINES.map((engine) => (
            <article key={engine.name} className="card card-hover">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">{engine.name}</h3>
              <p className="mt-2 text-sm text-text-secondary">{engine.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="geo" className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-6 pb-20 lg:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-400">Geo-Forensic Hop Tracer</p>
          <h2 className="section-title mt-2">Unmask origin beyond the From header</h2>
          <ul className="mt-4 space-y-3 text-sm text-text-secondary">
            <li className="flex gap-2"><Globe2 className="mt-0.5 h-4 w-4 text-cyan-400" /> Reverse RFC 5321 Received parsing</li>
            <li className="flex gap-2"><Radar className="mt-0.5 h-4 w-4 text-violet-400" /> Tor / VPN / hosting unmasking</li>
            <li className="flex gap-2"><Fingerprint className="mt-0.5 h-4 w-4 text-amber-400" /> ASN + RDAP attribution with confidence fusion</li>
          </ul>
        </div>
        <div id="architecture" className="card">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Hop vector</p>
          <div className="mt-4 h-48 rounded-xl border border-cyan-500/20 bg-[radial-gradient(circle_at_20%_40%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(239,68,68,0.16),transparent_32%)]" style={{ backgroundColor: 'var(--map-bg)' }}>
            <svg viewBox="0 0 400 180" className="h-full w-full">
              <path d="M40 120 C 140 20, 260 40, 360 70" fill="none" stroke="#22d3ee" strokeWidth="2" />
              <circle cx="40" cy="120" r="6" fill="#ef4444" />
              <circle cx="200" cy="42" r="5" fill="#a855f7" />
              <circle cx="360" cy="70" r="6" fill="#10b981" />
              <text x="20" y="150" fill="#9ab0d6" fontSize="10">HK origin</text>
              <text x="300" y="100" fill="#9ab0d6" fontSize="10">MX gateway</text>
            </svg>
          </div>
        </div>
      </section>

      <section id="evidence" className="mx-auto w-[min(1180px,calc(100%-1.5rem))] pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-400">BSA 2023 §63(4) Legal Admissibility</p>
        <h2 className="section-title mt-2">Court-ready electronic evidence</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {BSA.map((item) => (
            <article key={item.title} className="card">
              <Lock className="h-5 w-5 text-emerald-400" />
              <h3 className="mt-3 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-16 w-[min(1180px,calc(100%-1.5rem))] card flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-display text-2xl font-bold text-text-primary">SOC impact, not a demo mock</p>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            Launch the analyst console to ingest real RFC 822 mail, cluster campaigns, and download BSA certificates from the FastAPI backend.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={openUpload} className="btn-secondary inline-flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <Link to="/console" className="btn-primary inline-flex items-center gap-2">
            <Workflow className="h-4 w-4" /> Launch Console
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-text-muted">
        MailShieldAI · SIH26106 · FastAPI + 5 ML engines + evidence vault
      </footer>
    </div>
  );
}
