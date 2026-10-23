/** Rebuilds the test database from migrations once per test run. */
export default async function setup() {
  await import('./setup-env');
  const { sequelize } = await import('../src/models');
  const { createMigrator } = await import('../src/config/umzug');
  const { seedCategories, seedMenus, seedRolesAndPermissions, seedSettings, seedStaffGroups } = await import(
    '../src/seeders/system'
  );

  if (!/test/.test(sequelize.getDatabaseName())) {
    throw new Error(`Refusing to reset non-test database "${sequelize.getDatabaseName()}"`);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  const [tables] = await sequelize.query('SHOW TABLES');
  for (const row of tables as Array<Record<string, string>>) {
    await sequelize.query(`DROP TABLE IF EXISTS \`${Object.values(row)[0]}\``);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  await createMigrator().up();
  await seedRolesAndPermissions();
  await seedSettings();
  await seedCategories();
  await seedStaffGroups();
  await seedMenus();
  await sequelize.close();
}
