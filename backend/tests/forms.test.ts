import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ContactSubmission, CpdProgramme, CpdSession } from '../src/models';
import { app, login, ORIGIN, startedAt } from './helpers';

const post = (url: string) => request(app).post(url).set('Origin', ORIGIN);

describe('public forms', () => {
  it('validates the contact form server-side', async () => {
    const res = await post('/api/v1/contact').send({ name: '', email: 'not-an-email', message: 'short', consent: true });
    expect(res.status).toBe(422);
    expect(res.body.error.fields.map((f: { path: string }) => f.path)).toEqual(expect.arrayContaining(['name', 'email', 'message']));
  });

  it('stores valid contact submissions privately', async () => {
    const res = await post('/api/v1/contact').send({
      name: 'Ama Mensah',
      email: 'Ama@Example.test',
      subject: 'Partnership enquiry',
      message: 'We would like to discuss a research partnership.',
      consent: true,
      startedAt: startedAt(),
    });
    expect(res.status).toBe(201);
    const row = await ContactSubmission.findOne({ where: { subject: 'Partnership enquiry' } });
    expect(row?.email).toBe('ama@example.test');
    expect(row?.ip_hash).toMatch(/^[a-f0-9]{64}$/);
    // There is no public endpoint for reading submissions.
    expect((await request(app).get('/api/v1/contact')).status).toBe(404);
    const admin = await login('admin');
    const list = await admin.agent.get('/api/v1/admin/submissions?q=Partnership');
    expect(list.body.data[0].ip_hash).toBeUndefined();
  });

  it('rejects bots via honeypot and timing checks', async () => {
    const base = { name: 'Bot', email: 'bot@example.test', message: 'Buy now buy now buy now', consent: true };
    expect((await post('/api/v1/contact').send({ ...base, website: 'http://spam.example', startedAt: startedAt() })).status).toBe(422);
    expect((await post('/api/v1/contact').send({ ...base, startedAt: Date.now() })).status).toBe(400);
  });

  it('subscribes once and does not reveal existing subscribers', async () => {
    const body = { email: 'reader@example.test', consent: true, startedAt: startedAt() };
    const first = await post('/api/v1/subscribers').send(body);
    expect(first.status).toBe(201);
    expect(first.body.data.status).toBe('subscribed');
    const second = await post('/api/v1/subscribers').send(body);
    expect(second.status).toBe(200);
    expect(second.body.data.message).toBe(first.body.data.message);
    expect((await post('/api/v1/subscribers').send({ email: 'x@example.test', startedAt: startedAt() })).status).toBe(422);
  });

  it('registers for an open CPD session, prevents duplicates and enforces capacity', async () => {
    const programme = await CpdProgramme.create({ title: 'Test CPD', slug: 'test-cpd', status: 'published', published_at: new Date() });
    const session = await CpdSession.create({
      programme_id: programme.id,
      starts_at: new Date(Date.now() + 864e5 * 10),
      registration_status: 'open',
      allow_online_registration: true,
      capacity: 1,
    });
    const reg = (email: string) =>
      post(`/api/v1/cpd/sessions/${session.id}/register`).send({ full_name: 'Kofi Boateng', email, consent: true, startedAt: startedAt() });
    const a = await reg('kofi@example.test');
    expect(a.status).toBe(201);
    expect(a.body.data.status).toBe('pending');
    expect((await reg('kofi@example.test')).status).toBe(409);
    const b = await reg('second@example.test');
    expect(b.body.data.status).toBe('waitlisted');

    await session.update({ registration_status: 'closed' });
    expect((await reg('third@example.test')).status).toBe(400);
  });
});
