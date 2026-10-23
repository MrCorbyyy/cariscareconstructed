import type { QueryInterface } from 'sequelize';
import type { MigrationFn } from 'umzug';
import * as m20261021000001 from './20261021000001-initial-schema';

export interface MigrationModule {
  up: MigrationFn<QueryInterface>;
  down: MigrationFn<QueryInterface>;
}

/**
 * Ordered list of schema migrations. Add new migrations to the end of this list;
 * never edit a migration that has already run in production.
 */
export const migrations: Array<{ name: string; module: MigrationModule }> = [
  { name: '20261021000001-initial-schema', module: m20261021000001 },
];
