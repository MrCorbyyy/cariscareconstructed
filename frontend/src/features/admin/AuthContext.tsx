'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth, setCsrfToken, setUnauthorizedHandler, type Session } from '@/services/admin';

interface AuthState {
  session: Session;
  can: (...permissions: string[]) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

/** Loads the current session; unauthenticated visitors are sent to /login. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const toLogin = useCallback(() => {
    setCsrfToken(null);
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const refresh = useCallback(
    () =>
      auth.me().then(
        (s) => {
          setCsrfToken(s.csrfToken);
          setSession(s);
          setState('ready');
        },
        (err: unknown) => {
          if ((err as { status?: number }).status === 401) toLogin();
          else setState('error');
        },
      ),
    [toLogin],
  );

  useEffect(() => {
    setUnauthorizedHandler(toLogin);
    void refresh();
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const value = useMemo<AuthState | null>(() => {
    if (!session) return null;
    const perms = new Set(session.permissions);
    return {
      session,
      can: (...p) => p.some((x) => perms.has(x)),
      logout: async () => {
        try {
          await auth.logout();
        } finally {
          setCsrfToken(null);
          router.replace('/login');
        }
      },
      refresh,
    };
  }, [session, refresh, router]);

  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-ink">The administration service is unavailable.</p>
          <button type="button" onClick={() => void refresh()} className="link mt-3">
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="text-muted">Loading dashboard…</span>
      </div>
    );
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
