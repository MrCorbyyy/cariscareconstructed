import { z } from 'zod';
import { ARTICLE_TYPES, EVENT_TYPES, PARTNER_TYPES, PUBLICATION_TYPES } from '../models/content';
import {
  optDate,
  optDateOnly,
  optEmail,
  optHttpUrl,
  optId,
  optLink,
  optText,
  optYear,
  publishFields,
  reqText,
  seoFields,
  slugField,
} from './common';

const html = z.string().max(2_000_000).nullish();
const sortOrder = z.coerce.number().int().min(0).max(100000).optional();
const flag = z.boolean().optional();
const idList = z.array(z.coerce.number().int().positive()).max(50).optional();

export const slideSchema = z.object({
  title: reqText(255),
  caption: optText(1000),
  image_id: optId,
  image_alt: optText(500),
  button_label: optText(80),
  button_url: optLink,
  secondary_label: optText(80),
  secondary_url: optLink,
  sort_order: sortOrder,
  starts_at: optDate,
  ends_at: optDate,
  ...publishFields,
});

export const pageSchema = z.object({
  title: reqText(255),
  path: z
    .string()
    .trim()
    .min(1)
    .max(191)
    .transform((v) => v.replace(/^\/+|\/+$/g, '').toLowerCase())
    .refine((v) => /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(v), {
      message: 'Path segments may contain lower-case letters, numbers and hyphens, separated by /',
    }),
  parent_id: optId,
  template: z.enum(['standard', 'wide', 'landing']).optional(),
  summary: optText(2000),
  body: html,
  hero_image_id: optId,
  sort_order: sortOrder,
  show_in_sitemap: flag,
  ...publishFields,
  ...seoFields,
});

export const categorySchema = z.object({
  name: reqText(120),
  slug: slugField,
  description: optText(500),
  sort_order: sortOrder,
});

export const articleSchema = z.object({
  type: z.enum(ARTICLE_TYPES).optional(),
  title: reqText(300),
  slug: slugField,
  excerpt: optText(2000),
  body: html,
  featured_image_id: optId,
  attachment_id: optId,
  author_name: optText(150),
  deadline_at: optDate,
  is_featured: flag,
  category_ids: idList,
  ...publishFields,
  ...seoFields,
});

export const researchThemeSchema = z.object({
  name: reqText(150),
  slug: slugField,
  summary: optText(2000),
  description: html,
  icon: optText(50),
  image_id: optId,
  sort_order: sortOrder,
  ...publishFields,
});

export const researchProjectSchema = z.object({
  theme_id: optId,
  title: reqText(300),
  slug: slugField,
  summary: optText(3000),
  problem: optText(5000),
  contribution: optText(5000),
  relevance: optText(5000),
  body: html,
  project_status: z.enum(['planned', 'ongoing', 'completed']).optional(),
  programme: optText(150),
  start_year: optYear,
  end_year: optYear,
  lead_researchers: optText(500),
  team: optText(5000),
  image_id: optId,
  is_featured: flag,
  ...publishFields,
  ...seoFields,
});

export const publicationSchema = z.object({
  type: z.enum(PUBLICATION_TYPES),
  title: reqText(500),
  slug: slugField,
  authors: optText(1000),
  abstract: optText(10000),
  body: html,
  publication_year: optYear,
  published_on: optDateOnly,
  venue: optText(300),
  doi: optText(255),
  external_url: optHttpUrl,
  citation: optText(3000),
  cover_image_id: optId,
  file_id: optId,
  research_project_id: optId,
  is_featured: flag,
  ...publishFields,
  ...seoFields,
});

const decimalValue = z.coerce
  .number()
  .min(0)
  .max(100)
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v === '' || v == null ? null : Number(v)));

export const lmiReportSchema = z.object({
  title: reqText(255),
  slug: slugField,
  year: z.coerce.number().int().min(2020).max(2100),
  quarter: z.coerce
    .number()
    .int()
    .min(1)
    .max(4)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v ? Number(v) : null)),
  period_label: reqText(100),
  lmi_value: decimalValue,
  future_lmi_value: decimalValue,
  value_source_url: optHttpUrl,
  summary: optText(5000),
  body: html,
  file_id: optId,
  cover_image_id: optId,
  indicators: z
    .array(
      z.object({
        indicator: z.string().trim().regex(/^[a-z0-9_]+$/).max(80),
        label: reqText(150),
        value: z.coerce.number().min(0).max(100),
      }),
    )
    .max(30)
    .optional(),
  ...publishFields,
});

export const staffGroupSchema = z.object({
  name: reqText(150),
  slug: slugField,
  description: optText(2000),
  sort_order: sortOrder,
});

export const staffProfileSchema = z.object({
  group_id: optId,
  name: reqText(150),
  slug: slugField,
  position: optText(200),
  department: optText(200),
  bio: html,
  qualifications: optText(3000),
  email: optEmail,
  linkedin_url: optHttpUrl,
  scholar_url: optHttpUrl,
  orcid_url: optHttpUrl,
  website_url: optHttpUrl,
  photo_id: optId,
  sort_order: sortOrder,
  ...publishFields,
});

export const partnerSchema = z.object({
  name: reqText(200),
  slug: slugField,
  partner_type: z.enum(PARTNER_TYPES).optional(),
  description: optText(5000),
  website_url: optHttpUrl,
  logo_id: optId,
  sort_order: sortOrder,
  is_featured: flag,
  ...publishFields,
});

export const cpdProgrammeSchema = z.object({
  title: reqText(300),
  slug: slugField,
  summary: optText(3000),
  description: html,
  target_audience: optText(5000),
  learning_objectives: optText(5000),
  facilitators: optText(5000),
  duration: optText(100),
  delivery_format: optText(150),
  fee_text: optText(255),
  registration_url: optHttpUrl,
  image_id: optId,
  is_featured: flag,
  ...publishFields,
  ...seoFields,
});

export const cpdSessionSchema = z.object({
  programme_id: z.coerce.number().int().positive(),
  label: optText(200),
  starts_at: z.union([z.iso.datetime({ offset: true }), z.iso.datetime({ local: true }), z.iso.date()]).transform((v) => new Date(v)),
  ends_at: optDate,
  venue: optText(255),
  delivery_mode: z.enum(['in_person', 'online', 'hybrid']).optional(),
  fee_text: optText(255),
  capacity: z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v ? Number(v) : null)),
  registration_status: z.enum(['open', 'closed', 'full', 'cancelled']).optional(),
  registration_url: optHttpUrl,
  allow_online_registration: flag,
});

export const eventSchema = z.object({
  title: reqText(300),
  slug: slugField,
  event_type: z.enum(EVENT_TYPES).optional(),
  summary: optText(3000),
  body: html,
  starts_at: z.union([z.iso.datetime({ offset: true }), z.iso.datetime({ local: true }), z.iso.date()]).transform((v) => new Date(v)),
  ends_at: optDate,
  all_day: flag,
  venue: optText(255),
  location_type: z.enum(['in_person', 'online', 'hybrid']).optional(),
  cost_text: optText(255),
  registration_url: optHttpUrl,
  website_url: optHttpUrl,
  image_id: optId,
  gallery_id: optId,
  is_featured: flag,
  attachment_ids: idList,
  ...publishFields,
  ...seoFields,
});

export const newsletterSchema = z.object({
  issue_number: z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v ? Number(v) : null)),
  title: reqText(255),
  slug: slugField,
  published_on: optDateOnly,
  summary: optText(3000),
  highlights: html,
  cover_image_id: optId,
  file_id: optId,
  online_url: optHttpUrl,
  ...publishFields,
});

export const gallerySchema = z.object({
  title: reqText(255),
  slug: slugField,
  description: optText(3000),
  cover_image_id: optId,
  items: z
    .array(z.object({ media_id: z.coerce.number().int().positive(), caption: optText(1000) }))
    .max(300)
    .optional(),
  ...publishFields,
});

export const redirectSchema = z.object({
  from_path: z
    .string()
    .trim()
    .min(1)
    .max(191)
    .transform((v) => '/' + v.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, ''))
    .refine((v) => !/\s/.test(v), 'Paths cannot contain spaces'),
  to_path: z.string().trim().min(1).max(1000),
  status_code: z.union([z.literal(301), z.literal(302), z.literal(308)]).optional(),
  is_enabled: flag,
  note: optText(255),
});
