import type { Request } from 'express';
import { AuditLog } from '../models';
import { hashIp } from '../utils/crypto';
import { logger } from '../utils/logger';

const SENSITIVE = /password|token|secret|hash|csrf|ip_hash/i;
const LONG_TEXT_FIELDS = new Set(['body', 'description', 'bio', 'highlights', 'abstract']);

/** Builds a compact before/after diff, omitting sensitive and very long values. */
export function diffChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of keys) {
    if (SENSITIVE.test(key) || ['updated_at', 'created_at'].includes(key)) continue;
    const from = before?.[key] ?? null;
    const to = after?.[key] ?? null;
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes[key] = LONG_TEXT_FIELDS.has(key)
      ? { from: from ? '[content]' : null, to: to ? '[content changed]' : null }
      : { from, to };
  }
  return changes;
}

export async function audit(
  req: Request | null,
  action: string,
  entity?: { type: string; id?: string | number | null; summary?: string },
  changes?: Record<string, unknown>,
) {
  try {
    await AuditLog.create({
      user_id: req?.auth?.user.id ?? null,
      user_email: req?.auth?.user.email ?? null,
      action,
      entity_type: entity?.type ?? null,
      entity_id: entity?.id != null ? String(entity.id) : null,
      summary: entity?.summary?.slice(0, 500) ?? null,
      changes: changes && Object.keys(changes).length ? JSON.stringify(changes).slice(0, 60000) : null,
      ip_hash: hashIp(req?.ip),
      user_agent: req?.get('user-agent')?.slice(0, 255) ?? null,
    });
  } catch (err) {
    // Auditing must never break the primary action.
    logger.error({ err, action }, 'Failed to write audit log');
  }
}
