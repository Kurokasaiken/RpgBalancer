import { useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType; duration?: number }>>([]);

  const showToast = (message: string, type: ToastType, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    showToast,
    toasts,
    removeToast,
  };
};
