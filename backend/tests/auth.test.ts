import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createUser, login, ORIGIN, PASSWORD } from './helpers';

describe('authentication', () => {
  it('reports health', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('ok');
  });

  it('rejects wrong credentials with a generic message', async () => {
    const user = await createUser('editor');
    const res = await request(app).post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: user.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
    const unknown = await request(app).post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: 'nobody@example.test', password: 'x' });
    expect(unknown.body.error.message).toBe('Invalid email or password');
  });

  it('sets an HttpOnly session cookie and returns permissions', async () => {
    const user = await createUser('editor');
    const res = await request(app).post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(200);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/carisca_sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(res.body.data.permissions).toContain('articles.publish');
    expect(res.body.data.csrfToken).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects disabled accounts', async () => {
    const user = await createUser('editor', { status: 'disabled' });
    const res = await request(app).post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('locks the account after repeated failures', async () => {
    const user = await createUser('author');
    for (let i = 0; i < 8; i++) {
      await request(app).post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: user.email, password: 'nope' });
    }
    const res = await request(app).post('/api/v1/auth/login').set('Origin', ORIGIN).send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/Too many failed attempts/);
  });

  it('returns the session on /me and ends it on logout', async () => {
    const { agent, send } = await login('reviewer');
    expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
    expect((await send('post', '/api/v1/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('requires the CSRF token on authenticated mutations', async () => {
    const { agent } = await login('editor');
    const res = await agent.post('/api/v1/admin/articles').set('Origin', ORIGIN).send({ title: 'No token' });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/CSRF/);
  });

  it('rejects state-changing requests from foreign origins', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Origin', 'https://evil.example').send({ email: 'a@b.c', password: 'x' });
    expect(res.status).toBe(403);
  });

  it('refuses password reset when email is not configured, without pretending to send', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').set('Origin', ORIGIN).send({ email: 'someone@example.test' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('email_not_configured');
  });

  it('changes password with the current password', async () => {
    const { send } = await login('author');
    const weak = await send('post', '/api/v1/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'short' });
    expect(weak.status).toBe(400);
    const ok = await send('post', '/api/v1/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'An0ther-Strong-Passphrase' });
    expect(ok.status).toBe(200);
  });
});
