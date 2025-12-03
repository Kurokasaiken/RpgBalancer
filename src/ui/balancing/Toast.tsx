import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-emerald-900/80 border-emerald-500/60',
    error: 'bg-red-900/80 border-red-500/60',
    info: 'bg-blue-900/80 border-blue-500/60',
  }[type];

  const textColor = {
    success: 'text-emerald-200',
    error: 'text-red-200',
    info: 'text-blue-200',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg border ${bgColor} ${textColor} text-sm flex items-center gap-2 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <span className="text-lg font-bold">{icon}</span>
      <span>{message}</span>
    </div>
  );
};

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

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType; duration?: number }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};
