import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { badRequest } from './errors';

/** Filters articles by category via a subquery so pagination is not distorted by the M:N join. */
export const inCategory = (value: string | number) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid category');
  return { id: { [Op.in]: sequelize.literal(`(SELECT article_id FROM article_categories WHERE category_id = ${id})`) } };
};
