import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.mailEnabled) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? (env.SMTP_SECURE ? 465 : 587),
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

export const isMailConfigured = () => env.mailEnabled;

/** Sends an email. Returns false (and logs) when SMTP is not configured or delivery fails. */
export async function sendMail(message: { to: string; subject: string; text: string; html?: string }) {
  const t = getTransporter();
  if (!t) {
    logger.warn({ subject: message.subject }, 'Email not sent: SMTP is not configured');
    return false;
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM, ...message });
    return true;
  } catch (err) {
    logger.error({ err: (err as Error).message, subject: message.subject }, 'Email delivery failed');
    return false;
  }
}
