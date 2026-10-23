import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { env } from '../config/env';
import { PasswordResetToken, Permission, Role, Session, User, sequelize } from '../models';
import { randomToken, sha256 } from '../utils/crypto';
import { badRequest, unauthorized } from '../utils/errors';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 8;
const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_MINUTES = 60;

// A real hash used to keep timing similar when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', BCRYPT_ROUNDS);

export const PASSWORD_MIN_LENGTH = 12;

export function validatePasswordStrength(password: string) {
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) problems.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) problems.push('upper- and lower-case letters');
  if (!/[0-9]/.test(password)) problems.push('a number');
  if (password.length > 200) problems.push('at most 200 characters');
  if (problems.length) throw badRequest(`Password must contain ${problems.join(', ')}.`, { field: 'password' });
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export interface AuthContext {
  user: User;
  session: Session;
  roles: string[];
  permissions: Set<string>;
}

export async function loadUserAccess(userId: number) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      },
    ],
  });
  if (!user) return null;
  const roles = (user.roles ?? []).map((r) => r.name);
  const permissions = new Set((user.roles ?? []).flatMap((r) => (r.permissions ?? []).map((p) => p.key)));
  return { user, roles, permissions };
}

/** Verifies credentials, applying lockout. Returns the user or throws a generic 401. */
export async function verifyCredentials(email: string, password: string): Promise<User> {
  const user = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw unauthorized('Invalid email or password');
  }
  if (user.locked_until && user.locked_until > new Date()) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw unauthorized('Too many failed attempts. Try again later.');
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok || user.status !== 'active') {
    if (!ok) {
      const failed = user.failed_login_count + 1;
      await user.update({
        failed_login_count: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        locked_until: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      });
    }
    throw unauthorized('Invalid email or password');
  }
  await user.update({ failed_login_count: 0, locked_until: null, last_login_at: new Date() });
  return user;
}

/** Creates a session row. Only the SHA-256 of the cookie token is stored. */
export async function createSession(userId: number, meta: { ip?: string | null; userAgent?: string | null }) {
  const token = randomToken(32);
  const now = new Date();
  const session = await Session.create({
    id: sha256(token),
    user_id: userId,
    csrf_token: randomToken(32),
    ip: meta.ip ?? null,
    user_agent: meta.userAgent?.slice(0, 255) ?? null,
    expires_at: new Date(now.getTime() + env.SESSION_ABSOLUTE_HOURS * 3_600_000),
    last_seen_at: now,
  });
  return { token, session };
}

/** Resolves a cookie token to a live session, enforcing idle and absolute expiry. */
export async function resolveSession(token: string): Promise<AuthContext | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await Session.findByPk(sha256(token));
  if (!session) return null;
  const now = Date.now();
  const idleLimit = session.last_seen_at.getTime() + env.SESSION_IDLE_MINUTES * 60_000;
  if (session.expires_at.getTime() < now || idleLimit < now) {
    await session.destroy();
    return null;
  }
  const access = await loadUserAccess(session.user_id);
  if (!access || access.user.status !== 'active') {
    await session.destroy();
    return null;
  }
  // Throttle "last seen" writes to once a minute.
  if (now - session.last_seen_at.getTime() > 60_000) {
    await session.update({ last_seen_at: new Date(now) });
  }
  return { session, ...access };
}

export const destroySession = (sessionId: string) => Session.destroy({ where: { id: sessionId } });

export const destroyUserSessions = (userId: number, exceptSessionId?: string) =>
  Session.destroy({
    where: { user_id: userId, ...(exceptSessionId ? { id: { [Op.ne]: exceptSessionId } } : {}) },
  });

export const purgeExpiredSessions = () => Session.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });

export async function changePassword(userId: number, newPassword: string, keepSessionId?: string) {
  validatePasswordStrength(newPassword);
  const password_hash = await hashPassword(newPassword);
  await sequelize.transaction(async (transaction) => {
    await User.update(
      { password_hash, password_changed_at: new Date(), failed_login_count: 0, locked_until: null },
      { where: { id: userId }, transaction },
    );
    await Session.destroy({
      where: { user_id: userId, ...(keepSessionId ? { id: { [Op.ne]: keepSessionId } } : {}) },
      transaction,
    });
  });
}

/** Issues a single-use reset token. Returns the raw token (to be emailed) or null if no such user. */
export async function createPasswordResetToken(email: string): Promise<{ user: User; token: string } | null> {
  const user = await User.findOne({ where: { email: email.trim().toLowerCase(), status: 'active' } });
  if (!user) return null;
  await PasswordResetToken.destroy({ where: { user_id: user.id } });
  const token = randomToken(32);
  await PasswordResetToken.create({
    user_id: user.id,
    token_hash: sha256(token),
    expires_at: new Date(Date.now() + RESET_TOKEN_MINUTES * 60_000),
  });
  return { user, token };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  validatePasswordStrength(newPassword);
  const record = await PasswordResetToken.findOne({ where: { token_hash: sha256(token), used_at: null } });
  if (!record || record.expires_at < new Date()) throw badRequest('This reset link is invalid or has expired.');
  await changePassword(record.user_id, newPassword);
  await record.update({ used_at: new Date() });
  return record.user_id;
}
