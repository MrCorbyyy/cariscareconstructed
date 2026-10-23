import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import { requirePermission } from '../../middleware/auth';
import { Permission, Role, User, sequelize } from '../../models';
import { audit } from '../../services/audit.service';
import { changePassword, destroyUserSessions, hashPassword, validatePasswordStrength } from '../../services/auth.service';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { listQuerySchema, paginate } from '../../validators/common';

export const usersRouter = Router();

const userInclude = [{ model: Role, as: 'roles', through: { attributes: [] }, attributes: ['id', 'name', 'label'] }];

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.email().max(191),
  password: z.string().min(1).max(200),
  role_ids: z.array(z.number().int().positive()).min(1).max(5),
  status: z.enum(['active', 'disabled']).optional(),
});
export const updateUserSchema = createUserSchema.omit({ password: true }).partial();
export const setPasswordSchema = z.object({ password: z.string().min(1).max(200) });

async function rolesFor(ids: number[]) {
  const roles = await Role.findAll({ where: { id: ids } });
  if (roles.length !== new Set(ids).size) throw badRequest('Unknown role selected.');
  return roles;
}

/** Only Super Administrators may grant or hold the super_admin role changes. */
function assertCanAssign(req: Express.Request, roles: Role[]) {
  if (roles.some((r) => r.name === 'super_admin') && !req.auth!.roles.includes('super_admin')) {
    throw forbidden('Only a Super Administrator can assign the Super Administrator role.');
  }
}

async function superAdminCount(excludeUserId?: number) {
  return User.count({
    where: { status: 'active', ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}) },
    include: [{ model: Role, as: 'roles', where: { name: 'super_admin' }, through: { attributes: [] } }],
    distinct: true,
  });
}

usersRouter.get('/roles', requirePermission('users.read'), async (_req, res) => {
  const roles = await Role.findAll({
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] }, attributes: ['key', 'label', 'group'] }],
    order: [['id', 'asc']],
  });
  res.json({ data: roles });
});

usersRouter.get('/', requirePermission('users.read'), async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const where = q.q ? { [Op.or]: [{ name: { [Op.like]: `%${q.q}%` } }, { email: { [Op.like]: `%${q.q}%` } }] } : {};
  const { rows, count } = await User.findAndCountAll({
    where,
    include: userInclude,
    order: [['name', 'asc']],
    distinct: true,
    ...paginate(q.page, q.pageSize),
  });
  res.json({ data: rows, meta: { page: q.page, pageSize: q.pageSize, total: count, totalPages: Math.ceil(count / q.pageSize) } });
});

usersRouter.get('/:id', requirePermission('users.read'), async (req, res) => {
  const user = await User.findByPk(Number(req.params.id), { include: userInclude });
  if (!user) throw notFound('User not found');
  res.json({ data: user });
});

usersRouter.post('/', requirePermission('users.create'), async (req, res) => {
  const body = createUserSchema.parse(req.body);
  validatePasswordStrength(body.password);
  const roles = await rolesFor(body.role_ids);
  assertCanAssign(req, roles);
  const user = await sequelize.transaction(async (t) => {
    const u = await User.create(
      {
        name: body.name,
        email: body.email,
        status: body.status ?? 'active',
        password_hash: await hashPassword(body.password),
        password_changed_at: new Date(),
      },
      { transaction: t },
    );
    await (u as unknown as { setRoles: (r: Role[], o: object) => Promise<void> }).setRoles(roles, { transaction: t });
    return u;
  });
  await audit(req, 'create', { type: 'user', id: user.id, summary: `${user.email} (${roles.map((r) => r.name).join(', ')})` });
  res.status(201).json({ data: await User.findByPk(user.id, { include: userInclude }) });
});

usersRouter.patch('/:id', requirePermission('users.update'), async (req, res) => {
  const user = await User.findByPk(Number(req.params.id), { include: userInclude });
  if (!user) throw notFound('User not found');
  const body = updateUserSchema.parse(req.body);
  const isSelf = user.id === req.auth!.user.id;
  const wasSuper = (user.roles ?? []).some((r) => r.name === 'super_admin');
  if (wasSuper && !req.auth!.roles.includes('super_admin')) throw forbidden('Only a Super Administrator can edit this user.');

  const roles = body.role_ids ? await rolesFor(body.role_ids) : null;
  if (roles) assertCanAssign(req, roles);
  const losingSuper = wasSuper && ((roles && !roles.some((r) => r.name === 'super_admin')) || body.status === 'disabled');
  if (losingSuper && (await superAdminCount(user.id)) === 0) {
    throw badRequest('At least one active Super Administrator must remain.');
  }
  if (isSelf && body.status === 'disabled') throw badRequest('You cannot disable your own account.');

  const before = { name: user.name, email: user.email, status: user.status, roles: (user.roles ?? []).map((r) => r.name) };
  await sequelize.transaction(async (t) => {
    const { role_ids: _ignored, ...fields } = body;
    await user.update(fields, { transaction: t });
    if (roles) await (user as unknown as { setRoles: (r: Role[], o: object) => Promise<void> }).setRoles(roles, { transaction: t });
  });
  if (body.status === 'disabled' || roles) await destroyUserSessions(user.id);
  const fresh = await User.findByPk(user.id, { include: userInclude });
  await audit(req, roles ? 'role_change' : 'update', { type: 'user', id: user.id, summary: fresh!.email }, {
    before,
    after: { name: fresh!.name, email: fresh!.email, status: fresh!.status, roles: (fresh!.roles ?? []).map((r) => r.name) },
  });
  res.json({ data: fresh });
});

/** Lets an administrator set a new password for a user (used when email reset is unavailable). */
usersRouter.post('/:id/password', requirePermission('users.update'), async (req, res) => {
  const user = await User.findByPk(Number(req.params.id), { include: userInclude });
  if (!user) throw notFound('User not found');
  if ((user.roles ?? []).some((r) => r.name === 'super_admin') && !req.auth!.roles.includes('super_admin')) {
    throw forbidden();
  }
  const { password } = setPasswordSchema.parse(req.body);
  await changePassword(user.id, password);
  await audit(req, 'password_set_by_admin', { type: 'user', id: user.id, summary: user.email });
  res.json({ data: { ok: true } });
});

usersRouter.delete('/:id', requirePermission('users.delete'), async (req, res) => {
  const user = await User.findByPk(Number(req.params.id), { include: userInclude });
  if (!user) throw notFound('User not found');
  if (user.id === req.auth!.user.id) throw badRequest('You cannot delete your own account.');
  const isSuper = (user.roles ?? []).some((r) => r.name === 'super_admin');
  if (isSuper && !req.auth!.roles.includes('super_admin')) throw forbidden();
  if (isSuper && (await superAdminCount(user.id)) === 0) throw badRequest('At least one active Super Administrator must remain.');
  await destroyUserSessions(user.id);
  await user.destroy();
  await audit(req, 'delete', { type: 'user', id: user.id, summary: user.email });
  res.status(204).end();
});
