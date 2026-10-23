import { Router } from 'express';
import { Op } from 'sequelize';
import { assertIdsExist, createResourceRouter, type ResourceConfig } from '../../controllers/resource.controller';
import {
  Article,
  Category,
  CpdProgramme,
  CpdSession,
  Event,
  EventAttachment,
  Gallery,
  GalleryItem,
  HomepageSlide,
  LmiIndicatorValue,
  LmiReport,
  MediaAsset,
  Newsletter,
  Page,
  Partner,
  Publication,
  Redirect,
  ResearchProject,
  ResearchTheme,
  StaffGroup,
  StaffProfile,
} from '../../models';
import { inCategory } from '../../utils/queries';
import { badRequest } from '../../utils/errors';
import {
  articleSchema,
  categorySchema,
  cpdProgrammeSchema,
  cpdSessionSchema,
  eventSchema,
  gallerySchema,
  lmiReportSchema,
  newsletterSchema,
  pageSchema,
  partnerSchema,
  publicationSchema,
  redirectSchema,
  researchProjectSchema,
  researchThemeSchema,
  slideSchema,
  staffGroupSchema,
  staffProfileSchema,
} from '../../validators/content';

const img = (as: string) => ({ model: MediaAsset, as });
const slugTag = (prefix: string) => (row: { get: (k: string) => unknown }) => [prefix, `${prefix}:${row.get('slug')}`, 'home', 'search'];

/** Admin content resources: [route segment, configuration]. Also used to generate the OpenAPI spec. */
export const resources: Array<[string, ResourceConfig]> = [
  [
    'slides',
    {
      entity: 'slide',
      model: HomepageSlide,
      permission: 'slides',
      schema: slideSchema,
      publishable: true,
      searchFields: ['title', 'caption'],
      include: [img('image')],
      tags: () => ['slides', 'home'],
    },
  ],
  [
    'pages',
    {
      entity: 'page',
      model: Page,
      permission: 'pages',
      schema: pageSchema,
      publishable: true,
      richText: ['body'],
      searchFields: ['title', 'path', 'summary'],
      sortable: ['title', 'path', 'published_at'],
      defaultOrder: [['path', 'asc']],
      include: [img('heroImage'), img('ogImage'), { model: Page, as: 'parent', attributes: ['id', 'title', 'path'] }],
      beforeSave: async (data, _req, existing) => {
        if (data.parent_id && existing && data.parent_id === existing.get('id')) {
          throw badRequest('A page cannot be its own parent.');
        }
        // Walk up the parent chain to prevent cycles.
        let parentId = data.parent_id as number | null | undefined;
        const seen = new Set<number>(existing ? [existing.get('id') as number] : []);
        while (parentId) {
          if (seen.has(parentId)) throw badRequest('This parent would create a loop in the page hierarchy.');
          seen.add(parentId);
          const parent = await Page.findByPk(parentId, { attributes: ['id', 'parent_id'] });
          if (!parent) throw badRequest('Parent page not found.');
          parentId = parent.parent_id;
        }
      },
      tags: (row) => ['pages', `page:${row.get('path')}`, 'menus', 'search'],
    },
  ],
  [
    'categories',
    {
      entity: 'category',
      model: Category,
      permission: 'categories',
      schema: categorySchema,
      slugFrom: 'name',
      searchFields: ['name', 'slug'],
      tags: () => ['articles', 'categories'],
    },
  ],
  [
    'articles',
    {
      entity: 'article',
      model: Article,
      permission: 'articles',
      schema: articleSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['body'],
      searchFields: ['title', 'excerpt', 'slug'],
      sortable: ['title', 'published_at', 'type'],
      defaultOrder: [['updated_at', 'desc']],
      virtualFields: ['category_ids'],
      filters: {
        type: (v) => ({ type: v.split(',') }),
        category: (v) => inCategory(v),
      },
      include: [
        img('featuredImage'),
        img('attachment'),
        img('ogImage'),
        { model: Category, as: 'categories', through: { attributes: [] } },
      ],
      listInclude: [img('featuredImage'), { model: Category, as: 'categories', through: { attributes: [] } }],
      afterSave: async (row, body, _req, t) => {
        if (Array.isArray(body.category_ids)) {
          const ids = body.category_ids as number[];
          await assertIdsExist(Category, ids, t);
          await (row as unknown as Article).setCategories(ids, { transaction: t });
        }
      },
      tags: slugTag('articles'),
    },
  ],
  [
    'research-themes',
    {
      entity: 'research_theme',
      model: ResearchTheme,
      permission: 'research',
      schema: researchThemeSchema,
      publishable: true,
      slugFrom: 'name',
      richText: ['description'],
      searchFields: ['name', 'summary'],
      include: [img('image')],
      tags: () => ['research', 'home'],
    },
  ],
  [
    'research-projects',
    {
      entity: 'research_project',
      model: ResearchProject,
      permission: 'research',
      schema: researchProjectSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['body'],
      searchFields: ['title', 'summary', 'lead_researchers', 'programme'],
      sortable: ['title', 'published_at'],
      filters: { theme: (v) => ({ theme_id: Number(v) }) },
      include: [img('image'), img('ogImage'), { model: ResearchTheme, as: 'theme', attributes: ['id', 'name', 'slug'] }],
      tags: slugTag('research'),
    },
  ],
  [
    'publications',
    {
      entity: 'publication',
      model: Publication,
      permission: 'publications',
      schema: publicationSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['body'],
      searchFields: ['title', 'authors', 'venue', 'doi'],
      sortable: ['title', 'publication_year', 'published_at', 'type'],
      defaultOrder: [['publication_year', 'desc'], ['id', 'desc']],
      filters: { type: (v) => ({ type: v.split(',') }), year: (v) => ({ publication_year: Number(v) }) },
      include: [img('coverImage'), img('file'), img('ogImage')],
      tags: slugTag('publications'),
    },
  ],
  [
    'lmi-reports',
    {
      entity: 'lmi_report',
      model: LmiReport,
      permission: 'lmi',
      schema: lmiReportSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['body'],
      searchFields: ['title', 'period_label'],
      sortable: ['year'],
      defaultOrder: [['year', 'desc'], ['quarter', 'desc']],
      virtualFields: ['indicators'],
      include: [img('file'), img('coverImage'), { model: LmiIndicatorValue, as: 'indicators' }],
      afterSave: async (row, body, _req, t) => {
        if (!Array.isArray(body.indicators)) return;
        const items = body.indicators as Array<{ indicator: string; label: string; value: number }>;
        if (new Set(items.map((i) => i.indicator)).size !== items.length) {
          throw badRequest('Each indicator may appear only once per report.');
        }
        await LmiIndicatorValue.destroy({ where: { report_id: row.get('id') as number }, transaction: t });
        await LmiIndicatorValue.bulkCreate(
          items.map((i) => ({ ...i, report_id: row.get('id') as number })),
          { transaction: t },
        );
      },
      tags: () => ['lmi', 'home'],
    },
  ],
  [
    'staff-groups',
    {
      entity: 'staff_group',
      model: StaffGroup,
      permission: 'staff',
      schema: staffGroupSchema,
      slugFrom: 'name',
      searchFields: ['name'],
      tags: () => ['staff'],
    },
  ],
  [
    'staff',
    {
      entity: 'staff_profile',
      model: StaffProfile,
      permission: 'staff',
      schema: staffProfileSchema,
      publishable: true,
      slugFrom: 'name',
      richText: ['bio'],
      searchFields: ['name', 'position', 'department'],
      sortable: ['name'],
      defaultOrder: [['group_id', 'asc'], ['sort_order', 'asc']],
      filters: { group: (v) => ({ group_id: Number(v) }) },
      include: [img('photo'), { model: StaffGroup, as: 'group', attributes: ['id', 'name', 'slug'] }],
      tags: slugTag('staff'),
    },
  ],
  [
    'partners',
    {
      entity: 'partner',
      model: Partner,
      permission: 'partners',
      schema: partnerSchema,
      publishable: true,
      slugFrom: 'name',
      searchFields: ['name', 'description'],
      filters: { type: (v) => ({ partner_type: v }) },
      include: [img('logo')],
      tags: () => ['partners', 'home'],
    },
  ],
  [
    'cpd-programmes',
    {
      entity: 'cpd_programme',
      model: CpdProgramme,
      permission: 'cpd',
      schema: cpdProgrammeSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['description'],
      searchFields: ['title', 'summary', 'facilitators'],
      sortable: ['title', 'published_at'],
      include: [img('image'), img('ogImage'), { model: CpdSession, as: 'sessions' }],
      listInclude: [img('image')],
      tags: slugTag('cpd'),
    },
  ],
  [
    'cpd-sessions',
    {
      entity: 'cpd_session',
      model: CpdSession,
      permission: 'cpd',
      schema: cpdSessionSchema,
      searchFields: ['label', 'venue'],
      sortable: ['starts_at'],
      defaultOrder: [['starts_at', 'desc']],
      filters: {
        programme: (v) => ({ programme_id: Number(v) }),
        when: (v) => (v === 'upcoming' ? { starts_at: { [Op.gte]: new Date() } } : { starts_at: { [Op.lt]: new Date() } }),
      },
      include: [{ model: CpdProgramme, as: 'programme', attributes: ['id', 'title', 'slug'] }],
      beforeSave: async (data) => {
        if (data.programme_id) await assertIdsExist(CpdProgramme, [data.programme_id as number]);
        if (data.ends_at && data.starts_at && (data.ends_at as Date) < (data.starts_at as Date)) {
          throw badRequest('The session cannot end before it starts.');
        }
      },
      tags: () => ['cpd', 'home'],
    },
  ],
  [
    'events',
    {
      entity: 'event',
      model: Event,
      permission: 'events',
      schema: eventSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['body'],
      searchFields: ['title', 'venue', 'summary'],
      sortable: ['title', 'starts_at', 'published_at'],
      defaultOrder: [['starts_at', 'desc']],
      virtualFields: ['attachment_ids'],
      filters: {
        type: (v) => ({ event_type: v }),
        when: (v) => (v === 'upcoming' ? { starts_at: { [Op.gte]: new Date() } } : { starts_at: { [Op.lt]: new Date() } }),
      },
      include: [
        img('image'),
        img('ogImage'),
        { model: Gallery, as: 'gallery', attributes: ['id', 'title', 'slug'] },
        { model: EventAttachment, as: 'attachments', include: [img('media')] },
      ],
      listInclude: [img('image')],
      beforeSave: (data) => {
        if (data.ends_at && data.starts_at && (data.ends_at as Date) < (data.starts_at as Date)) {
          throw badRequest('The event cannot end before it starts.');
        }
      },
      afterSave: async (row, body, _req, t) => {
        if (!Array.isArray(body.attachment_ids)) return;
        const ids = body.attachment_ids as number[];
        await assertIdsExist(MediaAsset, ids, t);
        await EventAttachment.destroy({ where: { event_id: row.get('id') as number }, transaction: t });
        await EventAttachment.bulkCreate(
          ids.map((media_id, i) => ({ event_id: row.get('id') as number, media_id, sort_order: i })),
          { transaction: t },
        );
      },
      tags: slugTag('events'),
    },
  ],
  [
    'newsletters',
    {
      entity: 'newsletter',
      model: Newsletter,
      permission: 'newsletters',
      schema: newsletterSchema,
      publishable: true,
      slugFrom: 'title',
      richText: ['highlights'],
      searchFields: ['title', 'summary'],
      sortable: ['issue_number', 'published_on'],
      defaultOrder: [['published_on', 'desc']],
      include: [img('coverImage'), img('file')],
      tags: slugTag('newsletters'),
    },
  ],
  [
    'galleries',
    {
      entity: 'gallery',
      model: Gallery,
      permission: 'galleries',
      schema: gallerySchema,
      publishable: true,
      slugFrom: 'title',
      searchFields: ['title', 'description'],
      virtualFields: ['items'],
      include: [img('coverImage'), { model: GalleryItem, as: 'items', include: [img('media')] }],
      listInclude: [img('coverImage')],
      afterSave: async (row, body, _req, t) => {
        if (!Array.isArray(body.items)) return;
        const items = body.items as Array<{ media_id: number; caption: string | null }>;
        await assertIdsExist(MediaAsset, items.map((i) => i.media_id), t);
        await GalleryItem.destroy({ where: { gallery_id: row.get('id') as number }, transaction: t });
        await GalleryItem.bulkCreate(
          items.map((item, i) => ({ ...item, gallery_id: row.get('id') as number, sort_order: i })),
          { transaction: t },
        );
      },
      tags: slugTag('galleries'),
    },
  ],
  [
    'redirects',
    {
      entity: 'redirect',
      model: Redirect,
      permission: 'redirects',
      schema: redirectSchema,
      searchFields: ['from_path', 'to_path'],
      sortable: ['from_path', 'hits'],
      defaultOrder: [['from_path', 'asc']],
      tags: () => ['redirects'],
      label: (row) => String(row.get('from_path')),
    },
  ],
];

export const resourcesRouter = Router();
for (const [path, cfg] of resources) resourcesRouter.use(`/${path}`, createResourceRouter(cfg));
