import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Globe, Loader2, Shield, Upload, X, Zap } from 'lucide-react';
import { ingestEmailFile, ingestRawEmail } from '../api/client';
import { EMAIL_PRESETS, PIPELINE_STAGES, type PresetKey } from '../data/presets';
import { useAppStore } from '../hooks/useAppStore';
import { cn } from '../utils/cn';
import type { UploadProgress } from '../types';

const STAGES: UploadProgress['stage'][] = [
  'upload',
  'parse',
  'ml_inference',
  'geo_forensics',
  'evidence_seal',
  'complete',
];

function stageCopy(stage: UploadProgress['stage']) {
  switch (stage) {
    case 'upload':
      return 'Uploading RFC 822 payload';
    case 'parse':
      return 'Parsing headers, MIME, and identity';
    case 'ml_inference':
      return 'Running 5-engine ML ensemble';
    case 'geo_forensics':
      return 'Tracing SMTP hops and ASN origin';
    case 'evidence_seal':
      return 'Sealing SHA-256 Merkle ledger';
    default:
      return 'Analysis complete';
  }
}

export function UploadModal() {
  const navigate = useNavigate();
  const { uploadOpen, closeUpload, progress, setProgress, addToast } = useAppStore();
  const [content, setContent] = useState('');
  const [active, setActive] = useState<PresetKey | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result ?? ''));
      setActive(null);
    };
    reader.readAsText(file);
  }, []);

  const run = async (file?: File) => {
    if (!file && !content.trim()) {
      addToast({ type: 'warning', title: 'No payload', message: 'Paste RFC 822 text or pick a preset.' });
      return;
    }
    setProgress({ stage: 'upload', progress: 8, message: stageCopy('upload') });
    try {
      const tick = async (stage: UploadProgress['stage'], pct: number) => {
        setProgress({ stage, progress: pct, message: stageCopy(stage) });
        await new Promise((r) => setTimeout(r, 280));
      };
      await tick('upload', 12);
      await tick('parse', 28);
      const result = file ? await ingestEmailFile(file) : await ingestRawEmail(content);
      await tick('ml_inference', 58);
      await tick('geo_forensics', 76);
      await tick('evidence_seal', 92);
      setProgress({
        stage: 'complete',
        progress: 100,
        message: result.message,
        caseId: result.case_id,
      });
      addToast({ type: 'success', title: 'Case sealed', message: result.message });
      window.setTimeout(() => {
        closeUpload();
        navigate(`/console/cases/${result.case_id}`);
      }, 700);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ingest failed';
      addToast({
        type: 'error',
        title: 'Backend ingest failed',
        message: `${message}. Confirm FastAPI is running on :8000.`,
      });
      setProgress(null);
    }
  };

  if (!uploadOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="glass-strong w-full max-w-3xl overflow-hidden rounded-2xl border-cyan-500/20 shadow-glow-cyan">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-400">Universal Ingest</p>
            <h2 className="font-display text-lg font-bold text-white">Upload Email (.EML)</h2>
          </div>
          <button type="button" onClick={closeUpload} className="rounded-lg p-2 text-text-muted hover:bg-white/5 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {progress ? (
            <div className="space-y-3">
              {STAGES.map((stage, index) => {
                const current = STAGES.indexOf(progress.stage);
                const done = index < current || progress.stage === 'complete';
                const activeStage = index === current && progress.stage !== 'complete';
                return (
                  <div key={stage} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                    <div className={cn('grid h-9 w-9 place-items-center rounded-lg', done ? 'bg-emerald-500/15 text-emerald-400' : activeStage ? 'bg-cyan-500/15 text-cyan-300' : 'bg-bg-tertiary text-text-muted')}>
                      {done ? <CheckCircle className="h-4 w-4" /> : activeStage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{PIPELINE_STAGES[Math.min(index, PIPELINE_STAGES.length - 1)].name}</p>
                      <p className="text-xs text-text-muted">{stageCopy(stage)}</p>
                    </div>
                    <span className="font-mono text-xs text-text-muted">#{index + 1}</span>
                  </div>
                );
              })}
              {progress.caseId && <p className="font-mono text-xs text-cyan-400">case_id: {progress.caseId}</p>}
            </div>
          ) : (
            <>
              <label
                className={cn(
                  'grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                  drag ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 hover:border-cyan-500/40',
                )}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const file = e.dataTransfer.files[0];
                  if (file) onFile(file);
                }}
              >
                <Upload className="mb-2 h-8 w-8 text-cyan-400" />
                <p className="text-sm text-text-secondary">Drop .eml / .txt or click to browse</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".eml,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(file);
                  }}
                />
              </label>

              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setActive(null);
                }}
                className="input-field mt-4 h-40 resize-none font-mono text-xs"
                placeholder="Paste raw RFC 822 source…"
              />

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(EMAIL_PRESETS) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActive(key);
                      setContent(EMAIL_PRESETS[key].raw);
                    }}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left text-xs transition-colors',
                      active === key ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-white/10 text-text-secondary hover:border-cyan-500/30',
                    )}
                  >
                    {EMAIL_PRESETS[key].label}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn-primary flex-1" onClick={() => run()}>
                  Analyze Email
                </button>
                <button
                  type="button"
                  className="btn-secondary flex items-center justify-center gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileText className="h-4 w-4" />
                  Browse file
                </button>
              </div>
              <p className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                Zero retention after Merkle seal
                <Globe className="ml-2 h-3.5 w-3.5 text-emerald-400" />
                Geo hops attributed live
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
