import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, login } from './helpers';

describe('content workflow', () => {
  it('keeps drafts private and shows published articles publicly', async () => {
    const { send } = await login('editor');
    const created = await send('post', '/api/v1/admin/articles').send({
      title: 'Workflow Test Article',
      excerpt: 'Summary text for the workflow test.',
      body: '<p>Body <script>alert(1)</script><strong>bold</strong></p>',
      type: 'news',
    });
    expect(created.status).toBe(201);
    const { id, slug, body } = created.body.data;
    expect(slug).toBe('workflow-test-article');
    expect(body).not.toMatch(/script/);
    expect(body).toMatch(/<strong>bold<\/strong>/);

    expect((await request(app).get(`/api/v1/articles/${slug}`)).status).toBe(404);
    const draftList = await request(app).get('/api/v1/articles?q=Workflow');
    expect(draftList.body.data).toHaveLength(0);
    const search1 = await request(app).get('/api/v1/search?q=Workflow');
    expect(search1.body.data.results).toHaveLength(0);

    const published = await send('patch', `/api/v1/admin/articles/${id}`).send({ status: 'published' });
    expect(published.status).toBe(200);
    expect(published.body.data.published_at).toBeTruthy();

    const pub = await request(app).get(`/api/v1/articles/${slug}`);
    expect(pub.status).toBe(200);
    expect(pub.body.data.title).toBe('Workflow Test Article');
    expect(pub.body.data.created_by).toBeUndefined();
    expect(pub.body.data.review_note).toBeUndefined();

    const search2 = await request(app).get('/api/v1/search?q=Workflow');
    expect(search2.body.data.results.some((r: { url: string }) => r.url === `/news/${slug}`)).toBe(true);

    expect((await send('delete', `/api/v1/admin/articles/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/v1/articles/${slug}`)).status).toBe(404);
  });

  it('hides scheduled content until its publish date', async () => {
    const { send } = await login('editor');
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const res = await send('post', '/api/v1/admin/articles').send({ title: 'Scheduled Story', status: 'published', published_at: future });
    expect(res.status).toBe(201);
    expect((await request(app).get(`/api/v1/articles/${res.body.data.slug}`)).status).toBe(404);
  });

  it('generates unique slugs', async () => {
    const { send } = await login('editor');
    const a = await send('post', '/api/v1/admin/articles').send({ title: 'Same Title' });
    const b = await send('post', '/api/v1/admin/articles').send({ title: 'Same Title' });
    expect(a.body.data.slug).toBe('same-title');
    expect(b.body.data.slug).toBe('same-title-2');
  });

  it('validates input and reports field errors', async () => {
    const { send } = await login('editor');
    const res = await send('post', '/api/v1/admin/publications').send({ title: '', type: 'not-a-type' });
    expect(res.status).toBe(422);
    expect(res.body.error.fields.map((f: { path: string }) => f.path)).toEqual(expect.arrayContaining(['title', 'type']));
  });

  it('paginates and filters public lists', async () => {
    const { send } = await login('editor');
    for (let i = 0; i < 3; i++) {
      await send('post', '/api/v1/admin/publications').send({ title: `Policy brief ${i}`, type: 'policy_brief', publication_year: 2024, status: 'published' });
    }
    await send('post', '/api/v1/admin/publications').send({ title: 'Journal one', type: 'journal_article', publication_year: 2023, status: 'published' });
    const page1 = await request(app).get('/api/v1/publications?type=policy_brief&pageSize=2');
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta.total).toBe(3);
    expect(page1.body.meta.totalPages).toBe(2);
    const byYear = await request(app).get('/api/v1/publications?year=2023');
    expect(byYear.body.data.length).toBeGreaterThan(0);
    expect(byYear.body.data.every((p: { publication_year: number }) => p.publication_year === 2023)).toBe(true);
  });

  it('separates upcoming and past events', async () => {
    const { send } = await login('editor');
    await send('post', '/api/v1/admin/events').send({ title: 'Future Summit', starts_at: new Date(Date.now() + 864e5 * 30).toISOString(), status: 'published' });
    await send('post', '/api/v1/admin/events').send({ title: 'Past Workshop', starts_at: '2022-01-01T09:00:00Z', status: 'published' });
    const upcoming = await request(app).get('/api/v1/events?when=upcoming');
    const past = await request(app).get('/api/v1/events?when=past');
    expect(upcoming.body.data.map((e: { title: string }) => e.title)).toContain('Future Summit');
    expect(upcoming.body.data.map((e: { title: string }) => e.title)).not.toContain('Past Workshop');
    expect(past.body.data.map((e: { title: string }) => e.title)).toContain('Past Workshop');
    const bad = await send('post', '/api/v1/admin/events').send({ title: 'Backwards', starts_at: '2026-02-02T10:00:00Z', ends_at: '2026-02-01T10:00:00Z' });
    expect(bad.status).toBe(400);
  });

  it('resolves CMS pages and legacy redirects', async () => {
    const { send } = await login('editor');
    await send('post', '/api/v1/admin/pages').send({ title: 'Test Page', path: 'test-section/test-page', body: '<p>Hello</p>', status: 'published' });
    const admin = await login('admin');
    await admin.send('post', '/api/v1/admin/redirects').send({ from_path: '/old-test-page/', to_path: '/test-section/test-page' });
    const page = await request(app).get('/api/v1/pages/resolve?path=/test-section/test-page');
    expect(page.body.data.type).toBe('page');
    const redirect = await request(app).get('/api/v1/pages/resolve?path=/old-test-page/');
    expect(redirect.body.data).toMatchObject({ type: 'redirect', to: '/test-section/test-page', status: 301 });
    expect((await request(app).get('/api/v1/pages/resolve?path=/nothing-here')).status).toBe(404);
  });

  it('prevents cycles in the page hierarchy', async () => {
    const { send } = await login('editor');
    const a = await send('post', '/api/v1/admin/pages').send({ title: 'A', path: 'cycle-a' });
    const b = await send('post', '/api/v1/admin/pages').send({ title: 'B', path: 'cycle-b', parent_id: a.body.data.id });
    const res = await send('patch', `/api/v1/admin/pages/${a.body.data.id}`).send({ parent_id: b.body.data.id });
    expect(res.status).toBe(400);
  });

  it('updates navigation menus as a validated tree', async () => {
    const { send, agent } = await login('admin');
    const tooDeep = { items: [{ label: 'L1', children: [{ label: 'L2', children: [{ label: 'L3', children: [{ label: 'L4', url: '/x' }] }] }] }] };
    expect((await send('put', '/api/v1/admin/menus/utility').send(tooDeep)).status).toBe(400);
    const ok = await send('put', '/api/v1/admin/menus/utility').send({
      items: [{ label: 'News', url: '/news' }, { label: 'KNUST', url: 'https://www.knust.edu.gh/', open_in_new_tab: true }],
    });
    expect(ok.status).toBe(200);
    const site = await request(app).get('/api/v1/site');
    expect(site.body.data.menus.utility.map((i: { label: string }) => i.label)).toEqual(['News', 'KNUST']);
    expect(site.body.data.menus.utility[1].external).toBe(true);
    expect((await agent.get('/api/v1/admin/menus')).status).toBe(200);
  });

  it('returns 409 on unique constraint conflicts', async () => {
    const { send } = await login('admin');
    await send('post', '/api/v1/admin/redirects').send({ from_path: '/dup-path', to_path: '/a' });
    const dup = await send('post', '/api/v1/admin/redirects').send({ from_path: '/dup-path', to_path: '/b' });
    expect(dup.status).toBe(409);
  });
});
