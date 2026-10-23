import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, login } from './helpers';

describe('role-based access control', () => {
  it('blocks anonymous access to every admin route', async () => {
    for (const url of ['/api/v1/admin/articles', '/api/v1/admin/submissions', '/api/v1/admin/users', '/api/v1/admin/media', '/api/v1/admin/dashboard']) {
      expect((await request(app).get(url)).status, url).toBe(401);
    }
  });

  it('lets a reviewer read content but not create it', async () => {
    const { agent, send } = await login('reviewer');
    expect((await agent.get('/api/v1/admin/articles')).status).toBe(200);
    expect((await send('post', '/api/v1/admin/articles').send({ title: 'Nope' })).status).toBe(403);
    expect((await agent.get('/api/v1/admin/submissions')).status).toBe(403);
  });

  it('lets an author draft and submit for review but not publish', async () => {
    const { send } = await login('author');
    const draft = await send('post', '/api/v1/admin/articles').send({ title: 'Author draft', status: 'draft' });
    expect(draft.status).toBe(201);
    const id = draft.body.data.id;
    expect((await send('patch', `/api/v1/admin/articles/${id}`).send({ status: 'review' })).status).toBe(200);
    expect((await send('patch', `/api/v1/admin/articles/${id}`).send({ status: 'published' })).status).toBe(403);
    expect((await send('post', '/api/v1/admin/articles').send({ title: 'Direct publish', status: 'published' })).status).toBe(403);
    expect((await send('delete', `/api/v1/admin/articles/${id}`)).status).toBe(403);
  });

  it('stops an author editing content created by another user', async () => {
    const editor = await login('editor');
    const created = await editor.send('post', '/api/v1/admin/articles').send({ title: 'Editor owned' });
    const author = await login('author');
    const res = await author.send('patch', `/api/v1/admin/articles/${created.body.data.id}`).send({ title: 'Hijack' });
    expect(res.status).toBe(403);
  });

  it('keeps user management for super administrators', async () => {
    const editor = await login('editor');
    expect((await editor.agent.get('/api/v1/admin/users')).status).toBe(403);
    const admin = await login('admin');
    expect((await admin.agent.get('/api/v1/admin/users')).status).toBe(200);
    const attempt = await admin.send('post', '/api/v1/admin/users').send({ name: 'X', email: 'x@example.test', password: 'Abcdefgh1234', role_ids: [1] });
    expect(attempt.status).toBe(403);
  });

  it('never lets the last super administrator be removed', async () => {
    const { send, user } = await login('super_admin');
    const res = await send('delete', `/api/v1/admin/users/${user.id}`);
    expect(res.status).toBe(400);
  });

  it('records administrative actions in the audit log', async () => {
    const { send, agent } = await login('super_admin');
    await send('post', '/api/v1/admin/categories').send({ name: 'Audit check' });
    const logs = await agent.get('/api/v1/admin/audit-logs?entity=category');
    expect(logs.status).toBe(200);
    expect(logs.body.data.some((l: { summary: string }) => l.summary === 'Audit check')).toBe(true);
    expect(JSON.stringify(logs.body)).not.toMatch(/password/i);
  });
});
