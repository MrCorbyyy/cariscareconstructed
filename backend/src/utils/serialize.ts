import type { Model } from 'sequelize';
import { Op } from 'sequelize';

/** Columns that must never appear in public API responses. */
const PRIVATE_KEYS = new Set([
  'created_by',
  'updated_by',
  'review_note',
  'deleted_at',
  'legacy_url',
  'storage_path',
  'checksum',
  'uploaded_by',
  'source_url',
  'visibility',
  'filename',
  'ip_hash',
]);

export interface PublicMedia {
  id: number;
  url: string;
  kind: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  title: string | null;
  original_name: string;
}

const isMedia = (v: Record<string, unknown>) => 'storage_path' in v && 'mime_type' in v;

function toPublicMedia(m: Record<string, unknown>): PublicMedia | null {
  if (m.visibility !== 'public' || !m.url) return null;
  return {
    id: m.id as number,
    url: m.url as string,
    kind: m.kind as string,
    mime_type: m.mime_type as string,
    size_bytes: m.size_bytes as number,
    width: (m.width as number) ?? null,
    height: (m.height as number) ?? null,
    alt_text: (m.alt_text as string) ?? null,
    caption: (m.caption as string) ?? null,
    title: (m.title as string) ?? null,
    original_name: m.original_name as string,
  };
}

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value instanceof Date || value === null || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  if (isMedia(obj)) return toPublicMedia(obj);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PRIVATE_KEYS.has(k)) continue;
    out[k] = clean(v);
  }
  return out;
}

/** Converts Sequelize instances to plain public JSON, removing internal fields and private media. */
export function toPublic<T = Record<string, unknown>>(row: Model | Model[] | null): T {
  if (row == null) return null as T;
  const plain = Array.isArray(row) ? row.map((r) => r.toJSON()) : row.toJSON();
  return clean(plain) as T;
}

/** WHERE clause for content that is visible to the public right now. */
export const livePublished = () => ({ status: 'published', published_at: { [Op.lte]: new Date() } });
