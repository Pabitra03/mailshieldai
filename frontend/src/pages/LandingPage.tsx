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
      <header className="sticky top-3 sm:top-4 z-40 mx-auto flex w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] max-w-full items-center justify-between gap-2 sm:gap-3 rounded-full border border-border-primary bg-bg-secondary/90 px-2.5 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl shadow-sm overflow-hidden">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 min-w-0 shrink">
          <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
          <span className="font-display font-bold text-sm sm:text-base tracking-tight truncate">MailShieldAI</span>
        </Link>
        <nav className="hidden min-w-0 items-center gap-4 overflow-x-auto text-sm text-text-secondary xl:flex">
          <a href="#sandbox" className="hover:text-text-primary">Threat Sandbox</a>
          <a href="#engines" className="hover:text-text-primary">AI Engines</a>
          <a href="#geo" className="hover:text-text-primary">Geo Forensics</a>
          <a href="#evidence" className="hover:text-text-primary">Evidence</a>
          <a href="#architecture" className="hover:text-text-primary">Architecture</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="py-1 px-2.5 sm:py-1.5 sm:px-3 text-xs" />
          <button
            type="button"
            onClick={openUpload}
            className="hidden sm:inline-flex btn-secondary py-1.5 px-3 text-xs sm:text-sm font-medium"
          >
            Upload Email
          </button>
          <Link
            to="/console"
            className="btn-primary py-1.5 px-3.5 sm:py-2 sm:px-4 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm"
          >
            Console
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] gap-8 sm:gap-10 pb-16 sm:pb-20 pt-6 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-text-accent font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Autonomous Email Security
          </p>
          <h1 className="mt-4 sm:mt-6 font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.02] tracking-tight text-text-primary">
            Detect.
            <br />
            Investigate.
            <br />
            Defend.
          </h1>
          <p className="mt-4 sm:mt-5 text-lg sm:text-xl text-text-accent font-semibold">Advanced Email Threat Intelligence</p>
          <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-text-secondary leading-relaxed">
            MailShieldAI analyzes email identity, authentication, network origin, content signals, and threat relationships
            to uncover phishing, BEC, fraud, and suspicious activity across multi-stage attack campaigns.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <a href="#sandbox" className="btn-primary text-center py-2.5 sm:py-3 text-sm">Analyze Email</a>
            <Link to="/console" className="btn-secondary inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 text-sm">
              Open Threat Console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 sm:mt-8 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted">
            <span>Zero Data Retention</span>
            <span>·</span>
            <span>SHA-256 Merkle Proven</span>
            <span>·</span>
            <span>Sub-second Latency</span>
          </div>
        </div>

        <div className="card border-border-primary shadow-sm p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-crimson">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live Threat Detected
            </p>
            <p className="font-mono text-[10px] sm:text-[11px] text-text-muted">Latency: 342ms · Stage {Math.min(stage, 7)}/7</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-text-muted">Risk Score</p>
              <p className="font-display text-4xl sm:text-5xl font-bold text-text-crimson leading-tight">{scenario.risk.toFixed(1)}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 badge-critical">
                {scenario.tag} // CRITICAL
              </p>
            </div>
            <div className="text-left sm:text-right text-[11px] sm:text-xs text-text-secondary space-y-0.5 pt-1">
              <p>ORIGIN: <span className="text-text-primary font-medium">{scenario.origin}</span></p>
              <p className="text-text-crimson font-semibold text-[10px] sm:text-xs">AUTH: SPF FAIL · DKIM FAIL</p>
              <p className="text-text-muted text-[10px] sm:text-xs">NETWORK: 6 Hops Identified</p>
            </div>
          </div>
          <p className="mt-5 sm:mt-6 mb-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">Automated Analysis Pipeline</p>
          <div className="space-y-1.5 sm:space-y-2">
            {PIPELINE_STAGES.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3 py-2 text-xs sm:text-sm',
                  item.id <= stage ? 'border-border-glow bg-bg-tertiary text-text-primary font-medium' : 'border-border-primary text-text-muted',
                )}
              >
                <span>{item.name}</span>
                <span className="font-mono text-[11px] text-text-muted">#{item.id}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sandbox" className="mx-auto w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] pb-16 sm:pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-text-accent font-semibold">Interactive Threat Sandbox</p>
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
              className={cn('card py-4 text-left card-hover', preset === key && 'border-border-glow shadow-glow-cyan')}
            >
              <p className="font-display font-semibold text-text-primary">{EMAIL_PRESETS[key].label}</p>
              <p className="mt-1 text-xs text-text-muted">{EMAIL_PRESETS[key].tag} · {EMAIL_PRESETS[key].origin}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <pre className="card max-h-80 overflow-auto font-mono text-xs text-text-primary bg-bg-tertiary/50 border border-border-primary">{scenario.raw}</pre>
          <div className="card flex flex-col items-center justify-center gap-4">
            <RiskGauge score={scenario.risk} size={120} />
            <div className="w-full space-y-2 text-xs text-text-secondary">
              {metrics.map((m) => (
                <div key={m.label} className="flex justify-between">
                  <span>{m.label}</span>
                  <span className="font-mono text-text-accent font-semibold">{m.value}</span>
                </div>
              ))}
            </div>
            <button type="button" className="btn-primary w-full" onClick={openUpload}>
              Send to Analyst Console
            </button>
          </div>
        </div>
      </section>

      <section id="engines" className="mx-auto w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] pb-16 sm:pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-text-accent font-semibold">5-Engine ML Architecture</p>
        <h2 className="section-title mt-2">Ensemble that explains itself</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ENGINES.map((engine) => (
            <article key={engine.name} className="card card-hover">
              <Cpu className="h-5 w-5 text-text-accent" />
              <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">{engine.name}</h3>
              <p className="mt-2 text-sm text-text-secondary">{engine.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="geo" className="mx-auto grid w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] gap-6 pb-16 sm:pb-20 lg:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-text-accent font-semibold">Geo-Forensic Hop Tracer</p>
          <h2 className="section-title mt-2">Unmask origin beyond the From header</h2>
          <ul className="mt-4 space-y-3 text-sm text-text-secondary">
            <li className="flex gap-2"><Globe2 className="mt-0.5 h-4 w-4 text-text-accent" /> Reverse RFC 5321 Received parsing</li>
            <li className="flex gap-2"><Radar className="mt-0.5 h-4 w-4 text-violet-400" /> Tor / VPN / hosting unmasking</li>
            <li className="flex gap-2"><Fingerprint className="mt-0.5 h-4 w-4 text-amber-400" /> ASN + RDAP attribution with confidence fusion</li>
          </ul>
        </div>
        <div id="architecture" className="card">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Hop vector</p>
          <div className="mt-4 h-48 rounded-xl border border-border-primary bg-[radial-gradient(circle_at_20%_40%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(239,68,68,0.16),transparent_32%)]" style={{ backgroundColor: 'var(--map-bg)' }}>
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

      <section id="evidence" className="mx-auto w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] pb-16 sm:pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-text-accent font-semibold">BSA 2023 §63(4) Legal Admissibility</p>
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

      <section className="mx-auto mb-16 w-[calc(100%-1rem)] sm:w-[min(1180px,calc(100%-1.5rem))] card flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="font-display text-xl sm:text-2xl font-bold text-text-primary">SOC impact, not a demo mock</p>
          <p className="mt-2 max-w-xl text-sm text-text-secondary leading-relaxed">
            Launch the analyst console to ingest real RFC 822 mail, cluster campaigns, and download BSA certificates from the FastAPI backend.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5 sm:gap-3">
          <button type="button" onClick={openUpload} className="btn-secondary inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <Link to="/console" className="btn-primary inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold">
            <Workflow className="h-4 w-4" /> Launch Console
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-primary py-8 text-center text-xs text-text-muted">
        MailShieldAI · Enterprise SOC Platform · FastAPI + 5 ML engines + Merkle evidence vault
      </footer>
    </div>
  );
}
