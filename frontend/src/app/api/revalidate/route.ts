import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * On-demand cache purge, called by the Express API after content changes
 * (backend/src/services/revalidate.service.ts). Not part of the content API itself.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  const provided = request.headers.get('x-revalidate-secret') ?? '';
  const ok = secret.length >= 16 && provided.length === secret.length && timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let tags: unknown;
  try {
    ({ tags } = (await request.json()) as { tags?: unknown });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string' && t.length <= 256) || tags.length > 50) {
    return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
  }
  // Stale content is not served after an editor publishes: the next visit fetches fresh data.
  for (const tag of new Set(tags as string[])) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: tags, at: new Date().toISOString() });
}
