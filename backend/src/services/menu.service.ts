import { Menu, MenuItem, Page } from '../models';

export interface MenuNode {
  id: number;
  label: string;
  url: string | null;
  page_id: number | null;
  href: string;
  description: string | null;
  open_in_new_tab: boolean;
  is_enabled: boolean;
  external: boolean;
  children: MenuNode[];
}

/** Loads a menu's items in one query and assembles the tree in memory (no N+1). */
export async function buildMenuTree(menuId: number, opts: { includeDisabled?: boolean } = {}) {
  const items = await MenuItem.findAll({
    where: { menu_id: menuId, ...(opts.includeDisabled ? {} : { is_enabled: true }) },
    include: [{ model: Page, as: 'page', attributes: ['id', 'path', 'status'] }],
    order: [['sort_order', 'asc'], ['id', 'asc']],
  });
  const nodes = new Map<number, MenuNode>();
  for (const i of items) {
    const href = i.page ? `/${i.page.path}` : (i.url ?? '#');
    nodes.set(i.id, {
      id: i.id,
      label: i.label,
      url: i.url,
      page_id: i.page_id,
      href,
      description: i.description,
      open_in_new_tab: i.open_in_new_tab,
      is_enabled: i.is_enabled,
      external: /^https?:\/\//i.test(href),
      children: [],
    });
  }
  const roots: MenuNode[] = [];
  for (const i of items) {
    const node = nodes.get(i.id)!;
    const parent = i.parent_id ? nodes.get(i.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else if (!i.parent_id) roots.push(node);
    // Children of disabled parents are dropped with their parent.
  }
  return roots;
}

export async function getMenusByKey(keys?: string[]) {
  const menus = await Menu.findAll(keys ? { where: { key: keys } } : {});
  const out: Record<string, MenuNode[]> = {};
  for (const m of menus) out[m.key] = await buildMenuTree(m.id);
  return out;
}
