import { Router } from 'express';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth';
import { Menu, MenuItem, Page, sequelize } from '../../models';
import { audit } from '../../services/audit.service';
import { revalidateFrontend } from '../../services/revalidate.service';
import { buildMenuTree } from '../../services/menu.service';
import { badRequest, notFound } from '../../utils/errors';
import { linkUrl, optText } from '../../validators/common';

export const menusRouter = Router();

const MAX_DEPTH = 3;

interface ItemInput {
  label: string;
  url?: string | null;
  page_id?: number | null;
  description?: string | null;
  open_in_new_tab?: boolean;
  is_enabled?: boolean;
  children?: ItemInput[];
}

const itemSchema: z.ZodType<ItemInput> = z.lazy(() =>
  z
    .object({
      label: z.string().trim().min(1).max(120),
      url: linkUrl.nullish(),
      page_id: z.number().int().positive().nullish(),
      description: optText(255),
      open_in_new_tab: z.boolean().optional(),
      is_enabled: z.boolean().optional(),
      children: z.array(itemSchema).max(40).optional(),
    })
    .refine((v) => Boolean(v.url) || Boolean(v.page_id) || (v.children?.length ?? 0) > 0, {
      message: 'Each item needs a URL, a linked page, or child items',
    }),
);

export const menuTreeSchema = z.object({ items: z.array(itemSchema).max(40) });

menusRouter.get('/', requirePermission('menus.read'), async (_req, res) => {
  const menus = await Menu.findAll({ order: [['id', 'asc']] });
  const data = await Promise.all(
    menus.map(async (m) => ({ ...m.toJSON(), items: await buildMenuTree(m.id, { includeDisabled: true }) })),
  );
  res.json({ data });
});

/**
 * Replaces a menu's whole tree. Sending the tree (rather than parent ids) makes cycles
 * impossible by construction; depth is limited to keep dropdowns usable.
 */
menusRouter.put('/:key', requirePermission('menus.update'), async (req, res) => {
  const menu = await Menu.findOne({ where: { key: req.params.key } });
  if (!menu) throw notFound('Menu not found');
  const { items } = menuTreeSchema.parse(req.body);

  const pageIds = new Set<number>();
  const walk = (list: ItemInput[], depth: number) => {
    if (depth > MAX_DEPTH) throw badRequest(`Menus can be at most ${MAX_DEPTH} levels deep.`);
    for (const i of list) {
      if (i.page_id) pageIds.add(i.page_id);
      walk(i.children ?? [], depth + 1);
    }
  };
  walk(items, 1);
  if (pageIds.size && (await Page.count({ where: { id: [...pageIds] } })) !== pageIds.size) {
    throw badRequest('A menu item links to a page that no longer exists.');
  }

  await sequelize.transaction(async (t) => {
    await MenuItem.destroy({ where: { menu_id: menu.id }, transaction: t });
    const insert = async (list: ItemInput[], parentId: number | null) => {
      for (const [index, i] of list.entries()) {
        const row = await MenuItem.create(
          {
            menu_id: menu.id,
            parent_id: parentId,
            label: i.label,
            url: i.url ?? null,
            page_id: i.page_id ?? null,
            description: i.description ?? null,
            open_in_new_tab: i.open_in_new_tab ?? false,
            is_enabled: i.is_enabled ?? true,
            sort_order: index,
          },
          { transaction: t },
        );
        await insert(i.children ?? [], row.id);
      }
    };
    await insert(items, null);
  });

  await audit(req, 'update', { type: 'menu', id: menu.id, summary: `${menu.name} navigation updated` });
  void revalidateFrontend(['menus']);
  res.json({ data: { ...menu.toJSON(), items: await buildMenuTree(menu.id, { includeDisabled: true }) } });
});
