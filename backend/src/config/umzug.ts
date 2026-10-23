import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './database';
import { migrations } from '../migrations';
import { logger } from '../utils/logger';

export function createMigrator() {
  return new Umzug({
    migrations: migrations.map(({ name, module }) => ({
      name,
      up: module.up,
      down: module.down,
    })),
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
    logger: {
      info: (msg) => logger.info(msg),
      warn: (msg) => logger.warn(msg),
      error: (msg) => logger.error(msg),
      debug: (msg) => logger.debug(msg),
    },
  });
}
