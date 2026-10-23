import { NextResponse } from 'next/server';
import { SERVER_API_BASE_URL } from '@/lib/config';

/** Deployment health check: confirms the frontend is running and can reach the API. */
export async function GET() {
  let api: 'ok' | 'unreachable' | 'degraded' = 'unreachable';
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    api = res.ok ? 'ok' : 'degraded';
  } catch {
    api = 'unreachable';
  }
  return NextResponse.json({ frontend: 'ok', api, time: new Date().toISOString() }, { status: api === 'ok' ? 200 : 503 });
}
