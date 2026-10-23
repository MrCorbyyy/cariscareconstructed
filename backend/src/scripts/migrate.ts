/**
 * Database migration CLI.
 *   up      apply all pending migrations
 *   down    revert the most recent migration
 *   status  list executed and pending migrations
 */
import { sequelize } from '../config/database';
import { createMigrator } from '../config/umzug';

async function main() {
  const command = process.argv[2] ?? 'up';
  const migrator = createMigrator();

  if (command === 'up') {
    const applied = await migrator.up();
    console.log(applied.length ? `Applied: ${applied.map((m) => m.name).join(', ')}` : 'No pending migrations.');
  } else if (command === 'down') {
    const reverted = await migrator.down();
    console.log(reverted.length ? `Reverted: ${reverted.map((m) => m.name).join(', ')}` : 'Nothing to revert.');
  } else if (command === 'status') {
    const executed = await migrator.executed();
    const pending = await migrator.pending();
    console.log('Executed:', executed.map((m) => m.name));
    console.log('Pending :', pending.map((m) => m.name));
  } else {
    throw new Error(`Unknown command "${command}". Use up | down | status.`);
  }
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    await sequelize.close();
    process.exit(1);
  });
