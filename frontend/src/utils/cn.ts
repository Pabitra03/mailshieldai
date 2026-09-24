export function cn(...classes: Array<string | undefined | null | false | Record<string, boolean>>): string {
  return classes
    .flatMap((cls) => {
      if (!cls) return [];
      if (typeof cls === 'string') return cls;
      return Object.entries(cls)
        .filter(([, v]) => v)
        .map(([k]) => k);
    })
    .join(' ');
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function getRiskColor(score?: number | null): string {
  const n = score ?? 0;
  if (n >= 70) return 'text-text-crimson font-semibold';
  if (n >= 45) return 'text-text-amber font-semibold';
  if (n >= 25) return 'text-text-accent font-semibold';
  return 'text-text-emerald font-semibold';
}

export function getRiskBar(score?: number | null): string {
  const n = score ?? 0;
  if (n >= 70) return 'bg-red-500';
  if (n >= 45) return 'bg-amber-500';
  if (n >= 25) return 'bg-cyan-500';
  return 'bg-emerald-500';
}

export function getVerdictBadge(verdict?: string | null): string {
  switch ((verdict ?? '').toLowerCase()) {
    case 'phishing':
    case 'bec':
    case 'malware':
      return 'badge-critical';
    case 'look-alike':
    case 'suspicious':
      return 'badge-high';
    case 'novel':
      return 'badge-novelty';
    case 'low risk':
      return 'badge-medium';
    default:
      return 'badge-low';
  }
}

export function truncateHash(hash?: string | null, length = 18): string {
  if (!hash) return '—';
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length)}…`;
}

export function countryFlag(country?: string | null): string {
  const map: Record<string, string> = {
    'hong kong': '🇭🇰',
    india: '🇮🇳',
    'united states': '🇺🇸',
    usa: '🇺🇸',
    canada: '🇨🇦',
    nigeria: '🇳🇬',
    russia: '🇷🇺',
    china: '🇨🇳',
    vietnam: '🇻🇳',
    netherlands: '🇳🇱',
    germany: '🇩🇪',
    'united kingdom': '🇬🇧',
    singapore: '🇸🇬',
  };
  if (!country) return '🌐';
  return map[country.toLowerCase()] ?? '🌐';
}

export function normalizeShap(raw: unknown): Array<{ name: string; value: number }> {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const name = String(row.field ?? row.feature ?? row.name ?? row.label ?? 'feature');
        const value = Number(row.contribution ?? row.shap_value ?? row.value ?? 0);
        return { name, value };
      })
      .filter((row): row is { name: string; value: number } => Boolean(row));
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([name, value]) => ({
      name,
      value: Number(value ?? 0),
    }));
  }
  return [];
}

export function hopIp(hop: { ip_address?: string; ip?: string }): string {
  return hop.ip_address || hop.ip || 'unknown';
}
