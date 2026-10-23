import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: process.env.DOTENV_PATH || path.resolve(__dirname, '../../.env') });

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  /** Public base URL of this API, e.g. https://api.carisca.knust.edu.gh (used to build media URLs). */
  API_PUBLIC_URL: z.string().url().default('http://localhost:5000'),
  /** Comma-separated list of browser origins allowed to call the API with credentials. */
  FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),
  /** Set when the API is behind cPanel/Passenger or another reverse proxy. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_LOGGING: bool,
  DB_TIMEZONE: z.string().default('+00:00'),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_COOKIE_NAME: z.string().default('carisca_sid'),
  /** Optional parent domain for the session cookie, e.g. .carisca.knust.edu.gh. Leave empty for host-only. */
  COOKIE_DOMAIN: z.string().optional(),
  SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(120),
  SESSION_ABSOLUTE_HOURS: z.coerce.number().int().positive().default(12),

  STORAGE_DIR: z.string().default(path.resolve(__dirname, '../../storage')),
  UPLOAD_MAX_IMAGE_MB: z.coerce.number().positive().default(5),
  UPLOAD_MAX_DOCUMENT_MB: z.coerce.number().positive().default(25),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  /** Inbox that receives contact-form notifications (optional). */
  CONTACT_NOTIFY_EMAIL: z.string().optional(),

  /** Frontend on-demand revalidation endpoint and shared secret. */
  REVALIDATE_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  /** Serve Swagger UI at /api/docs and the spec at /api/openapi.json. Defaults to on outside production. */
  API_DOCS_ENABLED: z.enum(['true', 'false']).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast with a readable message; never print secret values.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid backend environment configuration:\n${issues}`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  allowedOrigins: raw.FRONTEND_URL.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  /** The API's own origin (same-origin requests, e.g. from the Swagger UI page). */
  selfOrigin: new URL(raw.API_PUBLIC_URL).origin,
  docsEnabled: raw.API_DOCS_ENABLED ? raw.API_DOCS_ENABLED === 'true' : raw.NODE_ENV !== 'production',
  mailEnabled: Boolean(raw.SMTP_HOST && raw.MAIL_FROM),
  publicStorageDir: path.join(raw.STORAGE_DIR, 'public'),
  privateStorageDir: path.join(raw.STORAGE_DIR, 'private'),
};

export type Env = typeof env;
