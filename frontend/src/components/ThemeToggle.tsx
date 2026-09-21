import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { cn } from '../utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const light = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-cyan-500/40',
        className,
      )}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
    >
      {light ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
      <span className="hidden sm:inline">{light ? 'Dark' : 'Light'}</span>
    </button>
  );
}
