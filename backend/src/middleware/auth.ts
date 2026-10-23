import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { resolveSession } from '../services/auth.service';
import { forbidden, unauthorized } from '../utils/errors';
import { safeEqual } from '../utils/crypto';

export const sessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  // Frontend and API are expected on the same registrable domain (same-site), so Lax is sufficient
  // and blocks the cookie on cross-site sub-requests.
  sameSite: 'lax',
  path: '/',
  domain: env.COOKIE_DOMAIN || undefined,
  maxAge: env.SESSION_ABSOLUTE_HOURS * 3_600_000,
});

/** Attaches `req.auth` when a valid session cookie is present. Never rejects. */
export async function loadSession(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  if (typeof token === 'string' && token) {
    const ctx = await resolveSession(token);
    if (ctx) req.auth = ctx;
    else res.clearCookie(env.SESSION_COOKIE_NAME, { ...sessionCookieOptions(), maxAge: undefined });
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(unauthorized());
  next();
}

/** Passes when the user has ANY of the listed permissions. */
export const requirePermission =
  (...keys: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!keys.some((k) => req.auth!.permissions.has(k))) return next(forbidden());
    next();
  };

export const hasPermission = (req: Request, key: string) => Boolean(req.auth?.permissions.has(key));

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-authenticated requests:
 *  1. state-changing requests from a browser must come from an allow-listed Origin;
 *  2. authenticated state-changing requests must echo the per-session CSRF token in X-CSRF-Token.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin')?.replace(/\/$/, '');
  if (origin && origin !== env.selfOrigin && !env.allowedOrigins.includes(origin)) {
    return next(forbidden('Request origin not allowed'));
  }

  if (req.auth) {
    const header = req.get('x-csrf-token') ?? '';
    if (!header || !safeEqual(header, req.auth.session.csrf_token)) {
      return next(forbidden('Invalid or missing CSRF token'));
    }
  }
  next();
}
