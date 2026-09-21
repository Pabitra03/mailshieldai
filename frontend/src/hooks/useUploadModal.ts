import { useAppStore } from './useAppStore';

export function useUploadModal() {
  const store = useAppStore();
  return {
    isOpen: store.uploadOpen,
    progress: store.progress,
    openModal: store.openUpload,
    closeModal: store.closeUpload,
    setProgress: store.setProgress,
    resetProgress: () => store.setProgress(null),
  };
}

export function useToast() {
  const store = useAppStore();
  return {
    toasts: store.toasts,
    addToast: store.addToast,
    removeToast: store.removeToast,
  };
}
