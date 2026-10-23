import { Op, type ModelStatic, type Model } from 'sequelize';

export function slugify(input: string, maxLength = 120): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'item';
}

/** Returns `base`, or `base-2`, `base-3`… whichever is free in the given model (including soft-deleted rows). */
export async function uniqueSlug(
  model: ModelStatic<Model>,
  base: string,
  field = 'slug',
  excludeId?: number,
): Promise<string> {
  const root = slugify(base);
  const rows = (await model.findAll({
    attributes: [field],
    where: {
      [field]: { [Op.or]: [root, { [Op.like]: `${root}-%` }] },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    paranoid: false,
    raw: true,
  })) as unknown as Array<Record<string, string>>;
  const taken = new Set(rows.map((r) => r[field]));
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}
