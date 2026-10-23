import { Router, type Response } from 'express';
import { Op, type WhereOptions } from 'sequelize';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth';
import {
  Article,
  AuditLog,
  ContactSubmission,
  CpdProgramme,
  CpdRegistration,
  CpdSession,
  Event,
  NewsletterSubscriber,
  Publication,
  SiteSetting,
  User,
} from '../../models';
import { audit } from '../../services/audit.service';
import { revalidateFrontend } from '../../services/revalidate.service';
import { badRequest, notFound } from '../../utils/errors';
import { listQuerySchema, paginate } from '../../validators/common';

export const operationsRouter = Router();

const meta = (page: number, pageSize: number, total: number) => ({ page, pageSize, total, totalPages: Math.ceil(total / pageSize) });

/** CSV with protection against spreadsheet formula injection. */
function sendCsv(res: Response, filename: string, header: string[], rows: unknown[][]) {
  const cell = (v: unknown) => {
    let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.attachment(filename);
  res.send('﻿' + body);
}

// ------------------------------------------------------------------ dashboard
operationsRouter.get('/dashboard', async (req, res) => {
  const now = new Date();
  const can = (k: string) => req.auth!.permissions.has(k);
  const [published, drafts, inReview, publications, upcomingEvents, upcomingCpd, newMessages, recent] = await Promise.all([
    Article.count({ where: { status: 'published' } }),
    Article.count({ where: { status: 'draft' } }),
    Article.count({ where: { status: 'review' } }),
    Publication.count({ where: { status: 'published' } }),
    Event.count({ where: { status: 'published', starts_at: { [Op.gte]: now } } }),
    CpdSession.count({ where: { starts_at: { [Op.gte]: now } } }),
    can('submissions.read') ? ContactSubmission.count({ where: { status: 'new' } }) : Promise.resolve(null),
    can('audit.read')
      ? AuditLog.findAll({
          where: { action: { [Op.notIn]: ['login', 'logout', 'login_failed'] } },
          order: [['created_at', 'desc']],
          limit: 10,
        })
      : Promise.resolve([]),
  ]);
  res.json({
    data: {
      counts: {
        publishedArticles: published,
        draftArticles: drafts,
        articlesInReview: inReview,
        publications,
        upcomingEvents,
        upcomingCpdSessions: upcomingCpd,
        newContactSubmissions: newMessages,
      },
      recentActivity: recent,
    },
  });
});

// ------------------------------------------------------------------ settings
operationsRouter.get('/settings', requirePermission('settings.read'), async (_req, res) => {
  res.json({ data: await SiteSetting.findAll({ order: [['group', 'asc'], ['sort_order', 'asc']] }) });
});

operationsRouter.patch('/settings', requirePermission('settings.update'), async (req, res) => {
  const updates = settingsUpdateSchema.parse(req.body);
  const settings = await SiteSetting.findAll({ where: { key: Object.keys(updates) } });
  if (settings.length !== Object.keys(updates).length) throw badRequest('Unknown setting key.');
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const s of settings) {
    const value = updates[s.key]?.trim() || null;
    if (s.type === 'email' && value && !z.email().safeParse(value).success) throw badRequest(`${s.label} must be an email address.`);
    if (s.type === 'url' && value && !/^https?:\/\/\S+$/.test(value)) throw badRequest(`${s.label} must be a full URL.`);
    if (value !== s.value) {
      changes[s.key] = { from: s.value, to: value };
      await s.update({ value, updated_by: req.auth!.user.id });
    }
  }
  await audit(req, 'settings_update', { type: 'settings', summary: Object.keys(changes).join(', ') }, changes);
  void revalidateFrontend(['settings']);
  res.json({ data: await SiteSetting.findAll({ order: [['group', 'asc'], ['sort_order', 'asc']] }) });
});

// ------------------------------------------------------------------ contact submissions
export const submissionStatusSchema = z.object({ status: z.enum(['new', 'read', 'replied', 'archived', 'spam']) });
export const subscriberStatusSchema = z.object({ status: z.enum(['subscribed', 'unsubscribed']) });
export const registrationStatusSchema = z.object({ status: z.enum(['pending', 'confirmed', 'waitlisted', 'cancelled']) });
export const settingsUpdateSchema = z.record(z.string().max(100), z.string().max(5000).nullable());

operationsRouter.get('/submissions', requirePermission('submissions.read'), async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const where: WhereOptions = {
    ...(typeof req.query.state === 'string' && req.query.state ? { status: req.query.state } : {}),
    ...(typeof req.query.topic === 'string' && req.query.topic ? { topic: req.query.topic } : {}),
    ...(q.q
      ? { [Op.or]: ['name', 'email', 'subject', 'message', 'organisation'].map((f) => ({ [f]: { [Op.like]: `%${q.q}%` } })) }
      : {}),
  };
  if (req.query.format === 'csv') {
    const rows = await ContactSubmission.findAll({ where, order: [['created_at', 'desc']], limit: 10000 });
    await audit(req, 'export', { type: 'contact_submission', summary: `${rows.length} rows` });
    return sendCsv(res, 'contact-submissions.csv', ['Date', 'Topic', 'Name', 'Email', 'Phone', 'Organisation', 'Subject', 'Message', 'Status'],
      rows.map((r) => [r.created_at, r.topic, r.name, r.email, r.phone, r.organisation, r.subject, r.message, r.status]));
  }
  const { rows, count } = await ContactSubmission.findAndCountAll({
    where,
    attributes: { exclude: ['ip_hash', 'user_agent'] },
    order: [['created_at', 'desc']],
    ...paginate(q.page, q.pageSize),
  });
  res.json({ data: rows, meta: meta(q.page, q.pageSize, count) });
});

operationsRouter.get('/submissions/:id', requirePermission('submissions.read'), async (req, res) => {
  const row = await ContactSubmission.findByPk(Number(req.params.id), {
    attributes: { exclude: ['ip_hash'] },
    include: [{ model: User, as: 'handler', attributes: ['id', 'name'] }],
  });
  if (!row) throw notFound();
  if (row.status === 'new' && req.auth!.permissions.has('submissions.update')) await row.update({ status: 'read' });
  res.json({ data: row });
});

operationsRouter.patch('/submissions/:id', requirePermission('submissions.update'), async (req, res) => {
  const row = await ContactSubmission.findByPk(Number(req.params.id));
  if (!row) throw notFound();
  const { status } = submissionStatusSchema.parse(req.body);
  await row.update({ status, handled_by: req.auth!.user.id });
  await audit(req, `status:${status}`, { type: 'contact_submission', id: row.id, summary: row.subject ?? row.email });
  res.json({ data: row });
});

operationsRouter.delete('/submissions/:id', requirePermission('submissions.delete'), async (req, res) => {
  const row = await ContactSubmission.findByPk(Number(req.params.id));
  if (!row) throw notFound();
  await row.destroy();
  await audit(req, 'delete', { type: 'contact_submission', id: row.id });
  res.status(204).end();
});

// ------------------------------------------------------------------ newsletter subscribers
operationsRouter.get('/subscribers', requirePermission('subscribers.read'), async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const where: WhereOptions = {
    ...(typeof req.query.state === 'string' && req.query.state ? { status: req.query.state } : {}),
    ...(q.q ? { [Op.or]: [{ email: { [Op.like]: `%${q.q}%` } }, { name: { [Op.like]: `%${q.q}%` } }] } : {}),
  };
  const attributes = ['id', 'email', 'name', 'status', 'source', 'consented_at', 'confirmed_at', 'unsubscribed_at', 'created_at'];
  if (req.query.format === 'csv') {
    const rows = await NewsletterSubscriber.findAll({ where, attributes, order: [['created_at', 'desc']] });
    await audit(req, 'export', { type: 'newsletter_subscriber', summary: `${rows.length} rows` });
    return sendCsv(res, 'newsletter-subscribers.csv', ['Email', 'Name', 'Status', 'Source', 'Consented', 'Confirmed', 'Unsubscribed'],
      rows.map((r) => [r.email, r.name, r.status, r.source, r.consented_at, r.confirmed_at, r.unsubscribed_at]));
  }
  const { rows, count } = await NewsletterSubscriber.findAndCountAll({ where, attributes, order: [['created_at', 'desc']], ...paginate(q.page, q.pageSize) });
  res.json({ data: rows, meta: meta(q.page, q.pageSize, count) });
});

operationsRouter.patch('/subscribers/:id', requirePermission('subscribers.update'), async (req, res) => {
  const row = await NewsletterSubscriber.findByPk(Number(req.params.id));
  if (!row) throw notFound();
  const { status } = subscriberStatusSchema.parse(req.body);
  await row.update({ status, ...(status === 'unsubscribed' ? { unsubscribed_at: new Date() } : { confirmed_at: row.confirmed_at ?? new Date(), unsubscribed_at: null }) });
  await audit(req, `status:${status}`, { type: 'newsletter_subscriber', id: row.id });
  res.json({ data: { id: row.id, status: row.status } });
});

operationsRouter.delete('/subscribers/:id', requirePermission('subscribers.delete'), async (req, res) => {
  const row = await NewsletterSubscriber.findByPk(Number(req.params.id));
  if (!row) throw notFound();
  await row.destroy();
  await audit(req, 'delete', { type: 'newsletter_subscriber', id: row.id });
  res.status(204).end();
});

// ------------------------------------------------------------------ CPD registrations
const registrationInclude = [
  {
    model: CpdSession,
    as: 'session',
    attributes: ['id', 'label', 'starts_at'],
    include: [{ model: CpdProgramme, as: 'programme', attributes: ['id', 'title'] }],
  },
];

operationsRouter.get('/registrations', requirePermission('registrations.read'), async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const where: WhereOptions = {
    ...(typeof req.query.session === 'string' && req.query.session ? { session_id: Number(req.query.session) } : {}),
    ...(typeof req.query.state === 'string' && req.query.state ? { status: req.query.state } : {}),
    ...(q.q ? { [Op.or]: ['full_name', 'email', 'organisation'].map((f) => ({ [f]: { [Op.like]: `%${q.q}%` } })) } : {}),
  };
  if (req.query.format === 'csv') {
    const rows = await CpdRegistration.findAll({ where, include: registrationInclude, order: [['created_at', 'desc']] });
    await audit(req, 'export', { type: 'cpd_registration', summary: `${rows.length} rows` });
    return sendCsv(res, 'cpd-registrations.csv', ['Registered', 'Programme', 'Session start', 'Name', 'Email', 'Phone', 'Organisation', 'Job title', 'Attendance', 'Status', 'Notes'],
      rows.map((r) => {
        const s = (r as unknown as { session?: CpdSession & { programme?: CpdProgramme } }).session;
        return [r.created_at, s?.programme?.title, s?.starts_at, r.full_name, r.email, r.phone, r.organisation, r.job_title, r.attendance_mode, r.status, r.notes];
      }));
  }
  const { rows, count } = await CpdRegistration.findAndCountAll({
    where,
    attributes: { exclude: ['ip_hash'] },
    include: registrationInclude,
    order: [['created_at', 'desc']],
    ...paginate(q.page, q.pageSize),
  });
  res.json({ data: rows, meta: meta(q.page, q.pageSize, count) });
});

operationsRouter.patch('/registrations/:id', requirePermission('registrations.update'), async (req, res) => {
  const row = await CpdRegistration.findByPk(Number(req.params.id));
  if (!row) throw notFound();
  const { status } = registrationStatusSchema.parse(req.body);
  await row.update({ status });
  await audit(req, `status:${status}`, { type: 'cpd_registration', id: row.id });
  res.json({ data: row });
});

operationsRouter.delete('/registrations/:id', requirePermission('registrations.delete'), async (req, res) => {
  const row = await CpdRegistration.findByPk(Number(req.params.id));
  if (!row) throw notFound();
  await row.destroy();
  await audit(req, 'delete', { type: 'cpd_registration', id: row.id });
  res.status(204).end();
});

// ------------------------------------------------------------------ audit log
operationsRouter.get('/audit-logs', requirePermission('audit.read'), async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const where: WhereOptions = {
    ...(typeof req.query.entity === 'string' && req.query.entity ? { entity_type: req.query.entity } : {}),
    ...(typeof req.query.action === 'string' && req.query.action ? { action: req.query.action } : {}),
    ...(typeof req.query.user === 'string' && req.query.user ? { user_id: Number(req.query.user) } : {}),
    ...(q.q ? { [Op.or]: [{ summary: { [Op.like]: `%${q.q}%` } }, { user_email: { [Op.like]: `%${q.q}%` } }] } : {}),
  };
  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    attributes: { exclude: ['ip_hash'] },
    order: [['created_at', 'desc']],
    ...paginate(q.page, q.pageSize),
  });
  res.json({ data: rows, meta: meta(q.page, q.pageSize, count) });
});
