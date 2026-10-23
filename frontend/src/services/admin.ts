'use client';

import { PUBLIC_API_BASE_URL } from '@/lib/config';
import type { PageMeta } from '@/types/api';
import { ClientApiError, parseError } from './client';

/**
 * Browser client for the administrative API. Authentication is an HttpOnly session cookie set by
 * the API (never readable by JavaScript); state-changing requests carry the per-session CSRF token.
 * Permissions are enforced by the API — the UI only hides controls.
 */
let csrfToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function adminRequest<T>(method: Method, path: string, body?: unknown, opts: { raw?: boolean } = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined && !isForm) headers['content-type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['x-csrf-token'] = csrfToken;
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new ClientApiError(0, 'Cannot reach the API server. Check your connection.');
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    onUnauthorized?.();
    throw new ClientApiError(401, 'Your session has expired. Please sign in again.');
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  if (opts.raw) return res as unknown as T;
  return (await res.json()) as T;
}

export const admin = {
  get: <T>(path: string) => adminRequest<{ data: T }>('GET', path).then((r) => r.data),
  list: <T>(path: string) => adminRequest<{ data: T[]; meta: PageMeta }>('GET', path),
  post: <T>(path: string, body?: unknown) => adminRequest<{ data: T }>('POST', path, body ?? {}).then((r) => r?.data),
  patch: <T>(path: string, body: unknown) => adminRequest<{ data: T }>('PATCH', path, body).then((r) => r.data),
  put: <T>(path: string, body: unknown) => adminRequest<{ data: T }>('PUT', path, body).then((r) => r.data),
  del: (path: string) => adminRequest<void>('DELETE', path),
  upload: <T>(path: string, form: FormData) => adminRequest<{ data: T }>('POST', path, form).then((r) => r.data),
  /** Downloads a CSV export through the authenticated session. */
  async download(path: string, filename: string) {
    const res = await adminRequest<Response>('GET', path, undefined, { raw: true });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'disabled';
  last_login_at: string | null;
  roles?: Array<{ id: number; name: string; label: string }>;
}

export interface Session {
  user: AdminUser;
  roles: string[];
  permissions: string[];
  csrfToken: string;
  sessionExpiresAt: string;
}

export const auth = {
  me: () => adminRequest<{ data: Session }>('GET', '/auth/me').then((r) => r.data),
  login: (email: string, password: string) => adminRequest<{ data: Session }>('POST', '/auth/login', { email, password }).then((r) => r.data),
  logout: () => adminRequest<void>('POST', '/auth/logout'),
};
