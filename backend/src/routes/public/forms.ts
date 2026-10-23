import { Router, type Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../../config/env';
import { ContactSubmission, CpdProgramme, CpdRegistration, CpdSession, NewsletterSubscriber, sequelize } from '../../models';
import { isMailConfigured, sendMail } from '../../services/mail.service';
import { hashIp, randomToken, sha256 } from '../../utils/crypto';
import { badRequest, conflict, notFound } from '../../utils/errors';
import { livePublished } from '../../utils/serialize';

export const publicFormsRouter = Router();

const formLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: env.isTest ? 1000 : 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many submissions. Please try again in a few minutes.' } },
});

/**
 * Low-friction bot protection that needs no third-party service:
 *  - `website` is a hidden honeypot field that people never fill in;
 *  - `startedAt` is when the form was rendered; real people take more than a few seconds.
 */
const antiSpam = {
  website: z.string().max(0, 'Invalid submission').optional().or(z.literal('')),
  startedAt: z.coerce.number().int().optional(),
};

function looksAutomated(body: { startedAt?: number }) {
  if (!body.startedAt) return false;
  const elapsed = Date.now() - body.startedAt;
  return elapsed < 2500 || elapsed > 24 * 3_600_000;
}

const linkCount = (s: string) => (s.match(/https?:\/\//gi) ?? []).length;
const phone = z.string().trim().max(40).regex(/^[+\d\s()-]*$/, 'Enter a valid phone number').optional().or(z.literal(''));

// ------------------------------------------------------------------ contact
const TOPICS = ['general', 'research', 'training', 'partnership', 'media', 'iscea_certification', 'lmi'] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(150),
  email: z.email('Enter a valid email address').max(191),
  phone,
  organisation: z.string().trim().max(200).optional(),
  subject: z.string().trim().max(255).optional(),
  message: z.string().trim().min(10, 'Please write a little more (at least 10 characters)').max(5000),
  topic: z.enum(TOPICS).default('general'),
  /** Extra structured answers, e.g. the ISCEA programme of interest. */
  details: z.record(z.string().max(60), z.string().max(500)).optional(),
  consent: z.literal(true, { error: 'Please confirm we may use your details to respond' }),
  ...antiSpam,
});

publicFormsRouter.post('/contact', formLimiter, async (req: Request, res) => {
  const body = contactSchema.parse(req.body);
  if (looksAutomated(body)) throw badRequest('Your message could not be sent. Please try again.');
  const spam = linkCount(body.message) > 4;
  const row = await ContactSubmission.create({
    topic: body.topic,
    name: body.name,
    email: body.email.toLowerCase(),
    phone: body.phone || null,
    organisation: body.organisation || null,
    subject: body.subject || null,
    message: body.message,
    details: body.details ? JSON.stringify(body.details) : null,
    status: spam ? 'spam' : 'new',
    ip_hash: hashIp(req.ip),
    user_agent: req.get('user-agent')?.slice(0, 255) ?? null,
  });
  if (!spam && env.CONTACT_NOTIFY_EMAIL) {
    void sendMail({
      to: env.CONTACT_NOTIFY_EMAIL,
      subject: `[CARISCA website] ${body.subject || 'New message'} (${body.topic})`,
      text: `From: ${body.name} <${body.email}>\nOrganisation: ${body.organisation ?? '-'}\nPhone: ${body.phone ?? '-'}\n\n${body.message}\n\nView in dashboard: submission #${row.id}`,
    });
  }
  res.status(201).json({ data: { ok: true, message: 'Thank you. Your message has been received and the CARISCA team will respond.' } });
});

// ------------------------------------------------------------------ newsletter
const CONSENT_TEXT =
  'I agree to receive the CARISCA newsletter and updates by email. I can unsubscribe at any time.';

export const subscribeSchema = z.object({
  email: z.email('Enter a valid email address').max(191),
  name: z.string().trim().max(150).optional(),
  consent: z.literal(true, { error: 'Please confirm you would like to receive the newsletter' }),
  source: z.string().max(60).optional(),
  ...antiSpam,
});

publicFormsRouter.post('/subscribers', formLimiter, async (req, res) => {
  const body = subscribeSchema.parse(req.body);
  if (looksAutomated(body)) throw badRequest('Subscription could not be completed. Please try again.');
  const email = body.email.toLowerCase();
  const doubleOptIn = isMailConfigured();
  const confirmToken = randomToken(32);

  const existing = await NewsletterSubscriber.findOne({ where: { email } });
  if (existing?.status === 'subscribed') {
    // Same response as a new sign-up, so the form cannot be used to discover subscribers.
    return res.status(200).json({ data: { ok: true, status: 'subscribed', message: 'Thank you. You are subscribed to the CARISCA newsletter.' } });
  }
  const values = {
    email,
    name: body.name || existing?.name || null,
    status: (doubleOptIn ? 'pending' : 'subscribed') as 'pending' | 'subscribed',
    consent_text: CONSENT_TEXT,
    consented_at: new Date(),
    confirm_token_hash: doubleOptIn ? sha256(confirmToken) : null,
    confirmed_at: doubleOptIn ? null : new Date(),
    unsubscribed_at: null,
    source: body.source ?? 'website',
    ip_hash: hashIp(req.ip),
  };
  const subscriber = existing
    ? await existing.update(values)
    : await NewsletterSubscriber.create({ ...values, unsubscribe_token: randomToken(32) });

  if (doubleOptIn) {
    const site = env.allowedOrigins[0];
    const sent = await sendMail({
      to: email,
      subject: 'Confirm your CARISCA newsletter subscription',
      text: `Please confirm your subscription to the CARISCA newsletter:\n${site}/newsletters/confirm?token=${confirmToken}\n\nIf you did not request this, ignore this email.\n\nUnsubscribe: ${site}/newsletters/unsubscribe?token=${subscriber.unsubscribe_token}`,
    });
    if (sent) {
      return res.status(201).json({ data: { ok: true, status: 'pending', message: 'Please check your inbox and confirm your subscription.' } });
    }
    // Email failed: keep the consented sign-up rather than losing it.
    await subscriber.update({ status: 'subscribed', confirmed_at: new Date(), confirm_token_hash: null });
  }
  res.status(201).json({ data: { ok: true, status: 'subscribed', message: 'Thank you. You are subscribed to the CARISCA newsletter.' } });
});

export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid link') });

publicFormsRouter.post('/subscribers/confirm', formLimiter, async (req, res) => {
  const { token } = tokenSchema.parse(req.body);
  const sub = await NewsletterSubscriber.findOne({ where: { confirm_token_hash: sha256(token) } });
  if (!sub) throw badRequest('This confirmation link is invalid or has already been used.');
  await sub.update({ status: 'subscribed', confirmed_at: new Date(), confirm_token_hash: null });
  res.json({ data: { ok: true, message: 'Your subscription is confirmed. Thank you.' } });
});

publicFormsRouter.post('/subscribers/unsubscribe', formLimiter, async (req, res) => {
  const { token } = tokenSchema.parse(req.body);
  const sub = await NewsletterSubscriber.findOne({ where: { unsubscribe_token: token } });
  if (sub && sub.status !== 'unsubscribed') await sub.update({ status: 'unsubscribed', unsubscribed_at: new Date() });
  res.json({ data: { ok: true, message: 'You have been unsubscribed from the CARISCA newsletter.' } });
});

// ------------------------------------------------------------------ CPD registration
export const registrationSchema = z.object({
  full_name: z.string().trim().min(2, 'Please enter your full name').max(150),
  email: z.email('Enter a valid email address').max(191),
  phone,
  organisation: z.string().trim().max(200).optional(),
  job_title: z.string().trim().max(150).optional(),
  attendance_mode: z.enum(['in_person', 'online']).optional(),
  notes: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { error: 'Please agree to the use of your details for this registration' }),
  ...antiSpam,
});

publicFormsRouter.post('/cpd/sessions/:id/register', formLimiter, async (req, res) => {
  const body = registrationSchema.parse(req.body);
  if (looksAutomated(body)) throw badRequest('Registration could not be completed. Please try again.');

  const result = await sequelize.transaction(async (t) => {
    // Lock the session row so concurrent registrations cannot exceed capacity.
    const session = await CpdSession.findByPk(Number(req.params.id), {
      include: [{ model: CpdProgramme, as: 'programme', where: livePublished(), attributes: ['id', 'title'] }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!session) throw notFound('This session is not available.');
    if (!session.allow_online_registration) throw badRequest('Registration for this session is handled externally.');
    if (session.registration_status !== 'open') throw badRequest('Registration for this session is closed.');
    if (session.starts_at < new Date()) throw badRequest('This session has already started.');

    const email = body.email.toLowerCase();
    if (await CpdRegistration.count({ where: { session_id: session.id, email }, transaction: t })) {
      throw conflict('You have already registered for this session with this email address.');
    }
    const active = await CpdRegistration.count({
      where: { session_id: session.id, status: ['pending', 'confirmed'] },
      transaction: t,
    });
    const full = session.capacity != null && active >= session.capacity;
    const reg = await CpdRegistration.create(
      {
        session_id: session.id,
        full_name: body.full_name,
        email,
        phone: body.phone || null,
        organisation: body.organisation || null,
        job_title: body.job_title || null,
        attendance_mode: body.attendance_mode ?? null,
        notes: body.notes || null,
        consent_at: new Date(),
        status: full ? 'waitlisted' : 'pending',
        ip_hash: hashIp(req.ip),
      },
      { transaction: t },
    );
    return { reg, session, full };
  });

  const programmeTitle = (result.session as CpdSession & { programme?: CpdProgramme }).programme?.title ?? 'CPD session';
  void sendMail({
    to: result.reg.email,
    subject: `CARISCA registration received: ${programmeTitle}`,
    text: `Dear ${result.reg.full_name},\n\nWe have received your registration for "${programmeTitle}". ${
      result.full ? 'The session is currently full, so you have been placed on the waiting list.' : 'The CARISCA team will contact you to confirm your place.'
    }\n\nCARISCA`,
  });
  res.status(201).json({
    data: {
      ok: true,
      status: result.reg.status,
      message: result.full
        ? 'This session is full. You have been added to the waiting list and the team will contact you if a place opens.'
        : 'Thank you. Your registration has been received and the CARISCA team will contact you to confirm your place.',
    },
  });
});
