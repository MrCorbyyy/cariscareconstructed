'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ClientApiError } from '@/services/client';

export const STATUS_STYLE: Record<string, string> = {
  published: 'bg-[#e7f5ee] text-success',
  draft: 'bg-surface-strong text-muted',
  review: 'bg-[#fff4de] text-warning',
  archived: 'bg-[#eef0f4] text-[#5b6476]',
  scheduled: 'bg-brand-50 text-brand-700',
  new: 'bg-brand-50 text-brand-700',
  read: 'bg-surface-strong text-muted',
  replied: 'bg-[#e7f5ee] text-success',
  spam: 'bg-[#fdecea] text-danger',
  pending: 'bg-[#fff4de] text-warning',
  confirmed: 'bg-[#e7f5ee] text-success',
  subscribed: 'bg-[#e7f5ee] text-success',
  unsubscribed: 'bg-surface-strong text-muted',
  waitlisted: 'bg-brand-50 text-brand-700',
  cancelled: 'bg-[#fdecea] text-danger',
  active: 'bg-[#e7f5ee] text-success',
  disabled: 'bg-[#fdecea] text-danger',
};

export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: string | null }) {
  const scheduled = status === 'published' && publishedAt && new Date(publishedAt) > new Date();
  const s = scheduled ? 'scheduled' : status;
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[s] ?? 'bg-surface text-muted'}`}>{s}</span>;
}

export function ReviewFlag({ note }: { note?: string | null }) {
  if (!note) return null;
  return (
    <span title={note} className="ml-2 inline-flex items-center gap-1 rounded bg-[#fff4de] px-1.5 py-0.5 text-[0.7rem] font-semibold text-warning">
      <AlertTriangle aria-hidden className="size-3" /> Needs review<span className="sr-only">: {note}</span>
    </span>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 py-10 text-muted">
      <Loader2 aria-hidden className="size-5 animate-spin" /> {label}
    </div>
  );
}

export function Panel({ title, children, actions, className = '' }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-(--radius-card) border border-line bg-white ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          {title && <h2 className="font-display text-base font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ErrorNotice({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-(--radius-card) border border-[#f6c9c4] bg-[#fdf0ee] p-4 text-danger">
      <p className="font-semibold">{error}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold underline">
          Try again
        </button>
      )}
    </div>
  );
}

/** Small data-loading hook with refresh, used by admin screens. */
export function useLoader<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      (d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
        setLoading(false);
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ClientApiError ? e.message : 'Failed to load.');
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps supplied by caller
  }, [...deps, version]);
  /** Re-runs the loader (e.g. after a change). */
  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);
  return { data, error, loading, reload, setData };
}

/** Accessible confirmation dialog built on the native <dialog> element. */
export function ConfirmButton({
  children,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  className,
  danger = true,
}: {
  children: ReactNode;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
  danger?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {children}
      </button>
      <dialog ref={ref} className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-(--radius-card) p-0 shadow-(--shadow-raised) backdrop:bg-black/40" aria-labelledby={`dlg-${title}`}>
        <div className="p-6">
          <h2 id={`dlg-${title}`} className="text-lg font-bold">
            {title}
          </h2>
          <div className="mt-2 text-muted">{message}</div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="rounded px-4 py-2 font-semibold text-muted hover:bg-surface" onClick={() => ref.current?.close()} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              className={`rounded px-4 py-2 font-semibold text-white disabled:opacity-60 ${danger ? 'bg-danger hover:bg-[#912018]' : 'bg-brand-700 hover:bg-brand-800'}`}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  ref.current?.close();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export const inputCls =
  'block w-full rounded-(--radius-card) border border-line bg-white px-3 py-2 text-[0.95rem] text-ink outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-100 aria-invalid:border-danger';

export const btn = {
  primary: 'inline-flex h-10 items-center gap-2 rounded-(--radius-card) bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60',
  secondary: 'inline-flex h-10 items-center gap-2 rounded-(--radius-card) border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface disabled:opacity-60',
  danger: 'inline-flex h-10 items-center gap-2 rounded-(--radius-card) border border-[#f6c9c4] bg-white px-4 text-sm font-semibold text-danger hover:bg-[#fdf0ee]',
  link: 'font-semibold text-brand-700 hover:underline',
};

export function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), obj);
}
