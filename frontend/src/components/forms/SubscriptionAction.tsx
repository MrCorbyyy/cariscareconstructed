'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientApiError, postPublic } from '@/services/client';

/** Confirms or cancels a newsletter subscription from an emailed link token. */
export function SubscriptionAction({ action, token }: { action: 'confirm' | 'unsubscribe'; token: string | undefined }) {
  const [state, setState] = useState<{ kind: 'working' | 'success' | 'error'; message: string }>(() =>
    token
      ? { kind: 'working', message: 'Please wait…' }
      : { kind: 'error', message: 'This link is incomplete. Please use the full link from your email.' },
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !token) return;
    ran.current = true;
    postPublic(`/subscribers/${action}`, { token })
      .then((r) => setState({ kind: 'success', message: r.message }))
      .catch((e: unknown) => setState({ kind: 'error', message: e instanceof ClientApiError ? e.message : 'Something went wrong. Please try again.' }));
  }, [action, token]);

  return (
    <p role="status" aria-live="polite" className={`text-lg ${state.kind === 'error' ? 'text-danger' : state.kind === 'success' ? 'text-success' : 'text-muted'}`}>
      {state.message}
    </p>
  );
}
