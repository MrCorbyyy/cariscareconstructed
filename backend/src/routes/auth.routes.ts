import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env';
import { requireAuth, sessionCookieOptions } from '../middleware/auth';
import { User } from '../models';
import { audit } from '../services/audit.service';
import {
  changePassword,
  createPasswordResetToken,
  createSession,
  destroySession,
  resetPasswordWithToken,
  resolveSession,
  verifyCredentials,
} from '../services/auth.service';
import { isMailConfigured, sendMail } from '../services/mail.service';
import { badRequest } from '../utils/errors';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.isTest ? 1000 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Count per IP + email so one attacker cannot lock out every account from one address.
  keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${String(req.body?.email ?? '').toLowerCase()}`,
  message: { error: { code: 'rate_limited', message: 'Too many login attempts. Please wait and try again.' } },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: env.isTest ? 1000 : 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many requests. Please try again later.' } },
});

export const loginSchema = z.object({ email: z.email().max(191), password: z.string().min(1).max(200) });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(1).max(200) });
export const forgotPasswordSchema = z.object({ email: z.email().max(191) });
export const resetPasswordSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), newPassword: z.string().min(1).max(200) });

function serializeAuth(req: Express.Request) {
  const a = req.auth!;
  return {
    user: a.user.toSafeJSON(),
    roles: a.roles,
    permissions: [...a.permissions].sort(),
    csrfToken: a.session.csrf_token,
    sessionExpiresAt: a.session.expires_at,
  };
}

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  let user;
  try {
    user = await verifyCredentials(email, password);
  } catch (err) {
    await audit(req, 'login_failed', { type: 'user', summary: email.toLowerCase() });
    throw err;
  }
  const { token, session } = await createSession(user.id, { ip: req.ip, userAgent: req.get('user-agent') });
  res.cookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions());
  req.auth = (await resolveSession(token)) ?? undefined;
  await audit(req, 'login', { type: 'user', id: user.id, summary: user.email });
  res.json({ data: { ...serializeAuth(req), csrfToken: session.csrf_token } });
});

authRouter.post('/logout', async (req, res) => {
  if (req.auth) {
    await audit(req, 'logout', { type: 'user', id: req.auth.user.id, summary: req.auth.user.email });
    await destroySession(req.auth.session.id);
  }
  res.clearCookie(env.SESSION_COOKIE_NAME, { ...sessionCookieOptions(), maxAge: undefined });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ data: serializeAuth(req) });
});

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const body = changePasswordSchema.parse(req.body);
  const user = await User.scope('withPassword').findByPk(req.auth!.user.id);
  if (!user || !(await bcrypt.compare(body.currentPassword, user.password_hash))) {
    throw badRequest('Your current password is incorrect.', { field: 'currentPassword' });
  }
  await changePassword(user.id, body.newPassword, req.auth!.session.id);
  await audit(req, 'password_change', { type: 'user', id: user.id, summary: user.email });
  res.json({ data: { ok: true } });
});

authRouter.post('/forgot-password', resetLimiter, async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  if (!isMailConfigured()) {
    // Be explicit: without SMTP the reset link cannot be delivered. Admins can reset passwords in the dashboard.
    return res.status(503).json({
      error: {
        code: 'email_not_configured',
        message:
          'Password reset by email is not available on this server. Please ask a Super Administrator to reset your password.',
      },
    });
  }
  const issued = await createPasswordResetToken(email);
  if (issued) {
    const link = `${env.allowedOrigins[0]}/login/reset?token=${issued.token}`;
    await sendMail({
      to: issued.user.email,
      subject: 'Reset your CARISCA website password',
      text: `A password reset was requested for your CARISCA website account.\n\nUse this link within 60 minutes:\n${link}\n\nIf you did not request this, you can ignore this email.`,
    });
    await audit(req, 'password_reset_requested', { type: 'user', id: issued.user.id, summary: issued.user.email });
  }
  // Same response whether or not the account exists.
  res.json({ data: { ok: true, message: 'If that email belongs to an account, a reset link has been sent.' } });
});

authRouter.post('/reset-password', resetLimiter, async (req, res) => {
  const body = resetPasswordSchema.parse(req.body);
  const userId = await resetPasswordWithToken(body.token, body.newPassword);
  await audit(req, 'password_reset', { type: 'user', id: userId });
  res.json({ data: { ok: true } });
});
