'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientApiError, postPublic } from '@/services/client';

type Status = { kind: 'success' | 'error'; message: string } | null;

/**
 * Shared state for public forms: submission, server-side field errors, success/error messages,
 * and the anti-bot honeypot/timer values expected by the API.
 */
export function usePublicForm<T extends Record<string, unknown>>(endpoint: string, initial: T) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const startedAt = useRef<number>(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: '' }));
  };

  const submit = async (extra: Record<string, unknown> = {}, opts: { resetOnSuccess?: boolean } = { resetOnSuccess: true }) => {
    setSubmitting(true);
    setStatus(null);
    setErrors({});
    try {
      const res = await postPublic(endpoint, { ...values, ...extra, website: honeypot, startedAt: startedAt.current });
      setStatus({ kind: 'success', message: res.message });
      if (opts.resetOnSuccess) setValues(initial);
      return res;
    } catch (err) {
      const e = err instanceof ClientApiError ? err : new ClientApiError(0, 'Something went wrong. Please try again.');
      setErrors(e.fields);
      setStatus({
        kind: 'error',
        message: Object.keys(e.fields).length ? 'Please correct the highlighted fields and try again.' : e.message,
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { values, set, errors, status, submitting, submit, honeypot, setHoneypot };
}
