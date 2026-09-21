import { create } from 'zustand';
import type { Toast, UploadProgress } from '../types';

interface AppState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  uploadOpen: boolean;
  progress: UploadProgress | null;
  toasts: Toast[];
  setSidebarOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  openUpload: () => void;
  closeUpload: () => void;
  setProgress: (progress: UploadProgress | null) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  uploadOpen: false,
  progress: null,
  toasts: [],
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
