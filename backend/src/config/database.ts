import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from '../utils/logger';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  timezone: env.DB_TIMEZONE,
  logging: env.DB_LOGGING ? (sql) => logger.debug({ sql }, 'sql') : false,
  define: {
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  dialectOptions: {
    charset: 'utf8mb4',
    dateStrings: false,
  },
  pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
});
