import { Link } from 'react-router-dom';
import { Database, Menu, Radio, Shield, Upload } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { ThemeToggle } from './ThemeToggle';

export function TopHUD() {
  const { setSidebarOpen, openUpload, toggleCollapsed } = useAppStore();

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-white/5 bg-bg-secondary/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-white/5"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="hidden lg:inline-flex p-2 rounded-lg text-text-secondary hover:bg-white/5"
            onClick={toggleCollapsed}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted truncate">
              Console <span className="text-cyan-400">//</span> Live Threat Feed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-text-secondary">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            Live Ingest
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-300">
            <Database className="h-3.5 w-3.5" />
            Merkle Ledger Sealed
          </div>
          <Link
            to="/"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
          >
            <Shield className="h-3.5 w-3.5" />
            Showcase
          </Link>
          <ThemeToggle />
          <button type="button" onClick={openUpload} className="btn-primary flex items-center gap-2 py-2 px-3 text-sm">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Ingest Email</span>
          </button>
        </div>
      </div>
    </header>
  );
}
