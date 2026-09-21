import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAppStore } from '../hooks/useAppStore';

export function ToastHost() {
  const { toasts, removeToast } = useAppStore();
  useEffect(() => undefined, [toasts]);

  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn('toast', `toast-${toast.type}`)} role="status">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-text-primary">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm text-text-secondary">{toast.message}</p>}
            </div>
            <button type="button" onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
