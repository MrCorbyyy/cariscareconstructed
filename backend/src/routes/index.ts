import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { sequelize } from '../models';
import { authRouter } from './auth.routes';
import { mediaRouter } from './admin/media';
import { menusRouter } from './admin/menus';
import { operationsRouter } from './admin/operations';
import { resourcesRouter } from './admin/resources';
import { usersRouter } from './admin/users';
import { publicContentRouter } from './public/content';
import { publicFormsRouter } from './public/forms';
import { publicSearchRouter } from './public/search';

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res) => {
  let database = 'ok';
  try {
    await sequelize.authenticate();
  } catch {
    database = 'unavailable';
  }
  res.status(database === 'ok' ? 200 : 503).json({
    status: database === 'ok' ? 'ok' : 'degraded',
    database,
    time: new Date().toISOString(),
  });
});

apiRouter.use('/auth', authRouter);

// Public, read-only content and public form submissions.
apiRouter.use(publicContentRouter);
apiRouter.use(publicSearchRouter);
apiRouter.use(publicFormsRouter);

// Administrative API: every route requires a session; each route checks its own permission.
const admin = Router();
admin.use(requireAuth);
admin.use(operationsRouter);
admin.use('/media', mediaRouter);
admin.use('/menus', menusRouter);
admin.use('/users', usersRouter);
admin.use(resourcesRouter);
apiRouter.use('/admin', admin);
