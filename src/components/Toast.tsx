'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastMessage = { id: number; text: string; type: 'success' | 'error' };

const ToastContext = createContext<{
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
} | null>(null);

let id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    const currentId = ++id;
    setToasts((prev) => [...prev, { id: currentId, text: message, type: 'success' }]);
    setTimeout(() => remove(currentId), 4000);
  }, [remove]);

  const showError = useCallback((message: string) => {
    const currentId = ++id;
    setToasts((prev) => [...prev, { id: currentId, text: message, type: 'error' }]);
    setTimeout(() => remove(currentId), 5000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`
              flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg min-w-[240px] max-w-sm
              ${t.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}
            `}
          >
            {t.type === 'success'
              ? <CheckCircle size={20} className="shrink-0 text-green-600" />
              : <XCircle size={20} className="shrink-0 text-red-500" />}
            <span className="flex-1 text-sm font-medium">{t.text}</span>
            <button
              type="button"
              aria-label="Fechar notificação"
              onClick={() => remove(t.id)}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showSuccess: () => {}, showError: () => {} };
  return ctx;
}
