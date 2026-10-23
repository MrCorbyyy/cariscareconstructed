'use client';

import { CheckCircle2, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Toast = { id: number; kind: 'success' | 'error'; message: string };
const Ctx = createContext<(kind: Toast['kind'], message: string) => void>(() => undefined);

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start gap-3 rounded-(--radius-card) border bg-white p-4 shadow-(--shadow-raised) ${t.kind === 'error' ? 'border-[#f6c9c4]' : 'border-[#c3e6d4]'}`}>
            {t.kind === 'success' ? <CheckCircle2 aria-hidden className="size-5 shrink-0 text-success" /> : <XCircle aria-hidden className="size-5 shrink-0 text-danger" />}
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button type="button" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss notification" className="text-muted hover:text-ink">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
