import { getRiskColor } from '../utils/cn';

export function RiskGauge({ score, size = 88 }: { score?: number | null; size?: number }) {
  const value = Math.max(0, Math.min(100, score ?? 0));
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={value >= 70 ? '#ef4444' : value >= 45 ? '#f59e0b' : '#10b981'}
          strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className={`font-display text-lg font-bold ${getRiskColor(value)}`}>{value.toFixed(1)}</p>
        <p className="text-[9px] uppercase tracking-widest text-text-muted">/ 100</p>
      </div>
    </div>
  );
}
