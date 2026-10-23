import request from 'supertest';
import { createApp } from '../src/app';
import { Role, User } from '../src/models';
import { hashPassword } from '../src/services/auth.service';

export const app = createApp();
export const ORIGIN = 'http://localhost:3000';
export const PASSWORD = 'Correct-Horse-Battery-9';

let counter = 0;

export async function createUser(roleName: string, overrides: Partial<{ email: string; status: 'active' | 'disabled' }> = {}) {
  counter++;
  const role = await Role.findOne({ where: { name: roleName } });
  const user = await User.create({
    name: `${roleName} user ${counter}`,
    email: overrides.email ?? `${roleName}.${counter}.${Date.now()}@example.test`,
    password_hash: await hashPassword(PASSWORD),
    status: overrides.status ?? 'active',
  });
  await (user as unknown as { addRole: (r: Role) => Promise<void> }).addRole(role!);
  return user;
}

/** Logs in and returns a cookie-carrying agent plus a helper that sends the CSRF token. */
export async function login(roleName: string) {
  const user = await createUser(roleName);
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: user.email, password: PASSWORD });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const csrf = res.body.data.csrfToken as string;
  const send = (method: 'post' | 'patch' | 'put' | 'delete', url: string) =>
    agent[method](url).set('Origin', ORIGIN).set('X-CSRF-Token', csrf);
  return { agent, csrf, user, send };
}

/** Timestamp accepted by the forms' anti-bot timer. */
export const startedAt = () => Date.now() - 10_000;
