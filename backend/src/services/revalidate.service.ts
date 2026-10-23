import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Tells the Next.js frontend to purge cached data for the given tags so published changes appear
 * without a rebuild. Best-effort: failures are logged, and pages still refresh on their timed revalidation.
 */
export async function revalidateFrontend(tags: string[]) {
  if (!env.REVALIDATE_URL || !env.REVALIDATE_SECRET || env.isTest || !tags.length) return;
  try {
    const res = await fetch(env.REVALIDATE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ tags: [...new Set(tags)] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) logger.warn({ status: res.status, tags }, 'Frontend revalidation request failed');
  } catch (err) {
    logger.warn({ err: (err as Error).message, tags }, 'Frontend revalidation unreachable');
  }
}
