import { create } from 'zustand';
import type { Toast, UploadProgress } from '../types';

export type Theme = 'dark' | 'light';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('mailshield-theme');
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#070b14' : '#eef3f9');
  window.localStorage.setItem('mailshield-theme', theme);
}

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  uploadOpen: boolean;
  progress: UploadProgress | null;
  toasts: Toast[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  openUpload: () => void;
  closeUpload: () => void;
  setProgress: (progress: UploadProgress | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: readStoredTheme(),
  sidebarOpen: false,
  sidebarCollapsed: false,
  uploadOpen: false,
  progress: null,
  toasts: [],
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openUpload: () => set({ uploadOpen: true, progress: null }),
  closeUpload: () => set({ uploadOpen: false, progress: null }),
  setProgress: (progress) => set({ progress }),
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    const duration = toast.duration ?? 5000;
    if (duration !== 0) {
      window.setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
