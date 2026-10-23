import crypto from 'node:crypto';
import { env } from '../config/env';

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

/** Keyed hash so stored IP addresses cannot be reversed or correlated across deployments. */
export const hashIp = (ip: string | undefined | null) =>
  ip ? crypto.createHmac('sha256', env.SESSION_SECRET).update(ip).digest('hex') : null;

export const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};
