import { PUBLIC_API_BASE_URL } from '@/lib/config';
import type { ApiErrorBody } from '@/types/api';

/** Error raised by browser-side API calls, carrying field-level validation messages. */
export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
    public code = 'error',
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function parseError(res: Response): Promise<ClientApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    /* empty or non-JSON body */
  }
  const fields: Record<string, string> = {};
  for (const f of body?.error?.fields ?? []) if (!fields[f.path]) fields[f.path] = f.message;
  const message =
    body?.error?.message ??
    (res.status === 429 ? 'Too many requests. Please wait a moment and try again.' : `Request failed (${res.status}).`);
  return new ClientApiError(res.status, message, fields, body?.error?.code, body?.error?.details);
}

/** POST to a public endpoint (contact, newsletter, CPD registration). */
export async function postPublic<T = { ok: boolean; message: string; status?: string }>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ClientApiError(0, 'We could not reach the server. Check your connection and try again.');
  }
  if (!res.ok) throw await parseError(res);
  return ((await res.json()) as { data: T }).data;
}
