import { z } from 'zod';
import { PUBLISH_STATUSES } from '../models/_shared';

export const MAX_PAGE_SIZE = 100;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
  q: z.string().trim().max(200).optional(),
  status: z.enum([...PUBLISH_STATUSES, 'scheduled']).optional(),
  sort: z.string().max(50).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
  mine: z.stringbool().optional(),
  trashed: z.stringbool().optional(),
}).loose();

export const publicListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(200).optional(),
}).loose();

export const paginate = (page: number, pageSize: number) => ({ limit: pageSize, offset: (page - 1) * pageSize });

export const pageMeta = (page: number, pageSize: number, total: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

// ------------------------------------------------------------------ field helpers
/** Optional string that normalises "" to null. */
export const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const reqText = (max: number) => z.string().trim().min(1, 'Required').max(max);

/** Absolute http(s) URL, root-relative path ("/news"), mailto: or tel:. */
export const linkUrl = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (v) => /^(https?:\/\/[^\s]+|\/[^\s]*|#[\w-]*|mailto:[^\s]+|tel:[+\d\s()-]+)$/i.test(v),
    'Enter a full URL (https://…) or a site path starting with /',
  );

export const optLink = linkUrl
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? v : null));

export const optHttpUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => /^https?:\/\/[^\s]+$/i.test(v), 'Enter a full URL starting with https://')
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? v : null));

export const optEmail = z
  .email()
  .max(191)
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? v.toLowerCase() : null));

export const optId = z.coerce
  .number()
  .int()
  .positive()
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? Number(v) : null));

export const optDate = z
  .union([z.iso.datetime({ offset: true }), z.iso.date(), z.iso.datetime({ local: true })])
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? new Date(v) : null));

export const optDateOnly = z
  .iso.date()
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? v : null));

export const optYear = z.coerce
  .number()
  .int()
  .min(1950)
  .max(2100)
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v ? Number(v) : null));

export const slugField = z
  .string()
  .trim()
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, 'Use lower-case letters, numbers and hyphens')
  .nullish()
  .transform((v) => v || undefined);

export const statusField = z.enum(PUBLISH_STATUSES).optional();

export const seoFields = {
  seo_title: optText(255),
  seo_description: optText(500),
  og_image_id: optId,
};

export const publishFields = {
  status: statusField,
  published_at: optDate,
  review_note: optText(5000),
};
