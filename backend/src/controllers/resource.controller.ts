import { Router, type Request, type Response } from 'express';
import {
  Op,
  type FindOptions,
  type Includeable,
  type Model,
  type ModelStatic,
  type Order,
  type Transaction,
  type WhereOptions,
} from 'sequelize';
import { z, type ZodObject, type ZodRawShape } from 'zod';
import { sequelize } from '../models';
import { requirePermission } from '../middleware/auth';
import { audit, diffChanges } from '../services/audit.service';
import { revalidateFrontend } from '../services/revalidate.service';
import { badRequest, forbidden, notFound } from '../utils/errors';
import { sanitizeRichText } from '../utils/html';
import { uniqueSlug } from '../utils/slug';
import { listQuerySchema, paginate } from '../validators/common';

type Row = Model & Record<string, unknown>;
type Body = Record<string, unknown>;

export interface ResourceConfig {
  /** Audit entity type, e.g. "article". */
  entity: string;
  model: ModelStatic<Model>;
  /** Permission module key, e.g. "articles" → articles.read / articles.create … */
  permission: string;
  schema: ZodObject<ZodRawShape>;
  /** Model has status/published_at and follows the publishing workflow. */
  publishable?: boolean;
  /** Generate a unique slug from this field when the slug is blank. */
  slugFrom?: string;
  slugField?: string;
  richText?: string[];
  searchFields?: string[];
  /** Extra list filters: query param → where clause builder. */
  filters?: Record<string, (value: string) => WhereOptions>;
  defaultOrder?: Order;
  sortable?: string[];
  include?: Includeable[];
  listInclude?: Includeable[];
  /** Fields that are not columns and are handled in afterSave (e.g. category_ids). */
  virtualFields?: string[];
  afterSave?: (row: Row, body: Body, req: Request, t: Transaction) => Promise<void>;
  beforeSave?: (data: Body, req: Request, existing: Row | null) => Promise<void> | void;
  /** Frontend cache tags to purge after any change. */
  tags?: (row: Row) => string[];
  label?: (row: Row) => string;
}

const STATUS_NEEDS_PUBLISH = new Set(['published', 'archived']);

function canEditRow(req: Request, cfg: ResourceConfig, row: Row) {
  const perms = req.auth!.permissions;
  if (perms.has(`${cfg.permission}.update`)) return true;
  if (perms.has(`${cfg.permission}.update_own`)) {
    return row.get('created_by') === req.auth!.user.id && row.get('status') !== 'published';
  }
  return false;
}

/** Applies the publishing workflow rules to an incoming payload. */
function applyStatusRules(req: Request, cfg: ResourceConfig, data: Body, existing: Row | null) {
  if (!cfg.publishable) return;
  const canPublish = req.auth!.permissions.has(`${cfg.permission}.publish`);
  const nextStatus = (data.status as string | undefined) ?? (existing?.get('status') as string | undefined) ?? 'draft';
  const prevStatus = existing?.get('status') as string | undefined;

  if (!canPublish) {
    if (STATUS_NEEDS_PUBLISH.has(nextStatus) && nextStatus !== prevStatus) {
      throw forbidden('You can save drafts or submit for review, but not publish or archive.');
    }
    // Authors cannot change the publication date of content.
    delete data.published_at;
  }
  if (nextStatus === 'published' && !data.published_at && !existing?.get('published_at')) {
    data.published_at = new Date();
  }
}

export function createResourceRouter(cfg: ResourceConfig) {
  const router = Router();
  const slugField = cfg.slugField ?? 'slug';
  const hasSort = Boolean(cfg.model.getAttributes().sort_order);
  const virtual = new Set(cfg.virtualFields ?? []);
  const label = (row: Row) =>
    cfg.label?.(row) ?? String(row.get('title') ?? row.get('name') ?? row.get('label') ?? `#${row.get('id')}`);

  const loadRow = async (id: string, extra: FindOptions = {}) => {
    const numeric = Number(id);
    if (!Number.isInteger(numeric) || numeric <= 0) throw notFound();
    const row = (await cfg.model.findByPk(numeric, { include: cfg.include, ...extra })) as Row | null;
    if (!row) throw notFound(`${cfg.entity} not found`);
    return row;
  };

  const prepare = async (req: Request, input: Body, existing: Row | null) => {
    const data: Body = { ...input };
    for (const f of cfg.richText ?? []) if (f in data) data[f] = sanitizeRichText(data[f] as string | null);
    if (cfg.slugFrom && slugField in cfg.model.getAttributes()) {
      const provided = (data[slugField] as string | undefined)?.trim();
      if (provided) data[slugField] = await uniqueSlug(cfg.model, provided, slugField, existing?.get('id') as number);
      else if (!existing) data[slugField] = await uniqueSlug(cfg.model, String(data[cfg.slugFrom] ?? cfg.entity));
      else delete data[slugField];
    }
    applyStatusRules(req, cfg, data, existing);
    await cfg.beforeSave?.(data, req, existing);
    const columns: Body = {};
    for (const [k, v] of Object.entries(data)) if (!virtual.has(k)) columns[k] = v;
    return { data, columns };
  };

  const finish = (row: Row) => revalidateFrontend(cfg.tags?.(row) ?? [cfg.permission]);

  // ---------------------------------------------------------------- list
  router.get('/', requirePermission(`${cfg.permission}.read`), async (req: Request, res: Response) => {
    const q = listQuerySchema.parse(req.query);
    const where: Record<string | symbol, unknown> = {};
    if (q.q && cfg.searchFields?.length) {
      where[Op.or] = cfg.searchFields.map((f) => ({ [f]: { [Op.like]: `%${q.q}%` } }));
    }
    if (q.status && cfg.publishable) {
      if (q.status === 'scheduled') {
        Object.assign(where, { status: 'published', published_at: { [Op.gt]: new Date() } });
      } else Object.assign(where, { status: q.status });
    }
    if (q.mine && req.auth) Object.assign(where, { created_by: req.auth.user.id });
    for (const [param, build] of Object.entries(cfg.filters ?? {})) {
      const value = (req.query as Record<string, unknown>)[param];
      if (typeof value === 'string' && value !== '') Object.assign(where, build(value));
    }
    const sortable = new Set(['id', 'created_at', 'updated_at', ...(cfg.sortable ?? [])]);
    const order: Order =
      q.sort && sortable.has(q.sort)
        ? [[q.sort, q.dir ?? 'desc']]
        : (cfg.defaultOrder ?? (hasSort ? [['sort_order', 'asc'], ['id', 'asc']] : [['created_at', 'desc']]));

    const trashed = Boolean(q.trashed && cfg.model.options.paranoid);
    if (trashed) where.deleted_at = { [Op.ne]: null };
    const { rows, count } = await cfg.model.findAndCountAll({
      where: where as WhereOptions,
      include: cfg.listInclude ?? cfg.include,
      order,
      distinct: true,
      paranoid: !trashed,
      ...paginate(q.page, q.pageSize),
    });
    res.json({ data: rows, meta: { page: q.page, pageSize: q.pageSize, total: count, totalPages: Math.ceil(count / q.pageSize) } });
  });

  // ---------------------------------------------------------------- read
  router.get('/:id', requirePermission(`${cfg.permission}.read`), async (req, res) => {
    res.json({ data: await loadRow(String(req.params.id)) });
  });

  // ---------------------------------------------------------------- create
  router.post('/', requirePermission(`${cfg.permission}.create`), async (req, res) => {
    const input = cfg.schema.parse(req.body ?? {});
    const row = await sequelize.transaction(async (t) => {
      const { data, columns } = await prepare(req, input, null);
      if (hasSort && columns.sort_order == null) {
        columns.sort_order = ((await cfg.model.max('sort_order', { transaction: t })) as number | null ?? 0) + 1;
      }
      const created = (await cfg.model.create(
        { ...columns, ...('created_by' in cfg.model.getAttributes() ? { created_by: req.auth!.user.id, updated_by: req.auth!.user.id } : {}) },
        { transaction: t },
      )) as Row;
      await cfg.afterSave?.(created, data, req, t);
      return created;
    });
    const fresh = await loadRow(String(row.get('id')));
    await audit(req, 'create', { type: cfg.entity, id: fresh.get('id') as number, summary: label(fresh) });
    void finish(fresh);
    res.status(201).json({ data: fresh });
  });

  // ---------------------------------------------------------------- update
  router.patch('/:id', requirePermission(`${cfg.permission}.update`, `${cfg.permission}.update_own`), async (req, res) => {
    const existing = await loadRow(String(req.params.id));
    if (!canEditRow(req, cfg, existing)) throw forbidden('You can only edit your own unpublished content.');
    const input = cfg.schema.partial().parse(req.body ?? {});
    const before = existing.get({ plain: true }) as Body;
    await sequelize.transaction(async (t) => {
      const { data, columns } = await prepare(req, input, existing);
      if ('updated_by' in cfg.model.getAttributes()) columns.updated_by = req.auth!.user.id;
      await existing.update(columns, { transaction: t });
      await cfg.afterSave?.(existing, data, req, t);
    });
    const fresh = await loadRow(String(req.params.id));
    const changes = diffChanges(before, fresh.get({ plain: true }) as Body);
    const statusChanged = before.status !== fresh.get('status');
    await audit(
      req,
      statusChanged && fresh.get('status') === 'published' ? 'publish' : statusChanged ? `status:${fresh.get('status')}` : 'update',
      { type: cfg.entity, id: fresh.get('id') as number, summary: label(fresh) },
      changes,
    );
    void finish(fresh);
    res.json({ data: fresh });
  });

  // ---------------------------------------------------------------- delete (soft where supported)
  router.delete('/:id', requirePermission(`${cfg.permission}.delete`), async (req, res) => {
    const row = await loadRow(String(req.params.id));
    await row.destroy();
    await audit(req, 'delete', { type: cfg.entity, id: row.get('id') as number, summary: label(row) });
    void finish(row);
    res.status(204).end();
  });

  if (cfg.model.options.paranoid) {
    router.post('/:id/restore', requirePermission(`${cfg.permission}.delete`), async (req, res) => {
      const row = await loadRow(String(req.params.id), { paranoid: false });
      await (row as unknown as { restore: () => Promise<void> }).restore();
      await audit(req, 'restore', { type: cfg.entity, id: row.get('id') as number, summary: label(row) });
      void finish(row);
      res.json({ data: row });
    });
  }

  // ---------------------------------------------------------------- reorder
  if (hasSort) {
    const reorderSchema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(500) });
    router.post('/reorder', requirePermission(`${cfg.permission}.update`), async (req, res) => {
      const { ids } = reorderSchema.parse(req.body);
      await sequelize.transaction(async (t) => {
        for (const [index, id] of ids.entries()) {
          await cfg.model.update({ sort_order: index + 1 }, { where: { id }, transaction: t });
        }
      });
      await audit(req, 'reorder', { type: cfg.entity, summary: `Reordered ${ids.length} items` });
      void revalidateFrontend([cfg.permission]);
      res.json({ data: { ids } });
    });
  }

  return router;
}

export const assertIdsExist = async (model: ModelStatic<Model>, ids: number[], t?: Transaction) => {
  if (!ids.length) return;
  const count = await model.count({ where: { id: ids }, transaction: t });
  if (count !== new Set(ids).size) throw badRequest('One or more referenced records do not exist.');
};
