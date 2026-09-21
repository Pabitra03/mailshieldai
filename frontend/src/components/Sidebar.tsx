import { Link, NavLink } from 'react-router-dom';
import {
  Activity,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  Network,
  Radio,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAppStore } from '../hooks/useAppStore';

const navItems = [
  { path: '/console/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/console', label: 'Live Threats', icon: Radio, end: true },
  { path: '/console/geo-intel', label: 'Geo Forensics', icon: Globe },
  { path: '/console/campaigns', label: 'Campaign Graph', icon: Network },
  { path: '/console/evidence', label: 'Evidence Vault', icon: Database },
  { path: '/console/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, openUpload } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-cyan-500/10 bg-bg-secondary/95 backdrop-blur-xl transition-all duration-300',
        sidebarCollapsed ? 'w-[76px]' : 'w-[240px]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-700 grid place-items-center shadow-glow-cyan">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-text-primary leading-tight">MailShieldAI</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400/70">SOC Mission Control</p>
            </div>
          )}
        </Link>
      </div>

      <p className={cn('px-4 pt-5 pb-2 text-[10px] uppercase tracking-[0.22em] text-text-muted', sidebarCollapsed && 'text-center px-0')}>
        {sidebarCollapsed ? 'NAV' : 'Navigation'}
      </p>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors',
                  isActive && 'text-cyan-500 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]',
                  sidebarCollapsed && 'justify-center px-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-4.5 w-4.5 h-4 w-4', isActive && 'text-cyan-400')} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {isActive && !sidebarCollapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2">
        <button
          type="button"
          onClick={openUpload}
          className={cn(
            'w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm',
            sidebarCollapsed && 'px-0',
          )}
        >
          <Upload className="h-4 w-4" />
          {!sidebarCollapsed && 'Upload Email'}
        </button>
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400" />
              Pipeline Live
            </span>
            <span className="font-mono text-cyan-400">v1.4</span>
          </div>
        )}
      </div>
    </aside>
  );
}
