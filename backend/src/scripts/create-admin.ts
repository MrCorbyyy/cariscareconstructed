/**
 * Creates (or promotes) a Super Administrator from the command line. There is no public
 * registration endpoint; this script — run on the server over SSH or the cPanel terminal —
 * is the only way to create the first administrator.
 *
 * Interactive:  npm run admin:create
 * Scripted:     ADMIN_EMAIL=… ADMIN_NAME=… ADMIN_PASSWORD=… npm run admin:create
 */
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';
import { Role, User, sequelize } from '../models';
import { hashPassword, validatePasswordStrength } from '../services/auth.service';
import { seedRolesAndPermissions } from '../seeders/system';

async function ask(rl: readline.Interface, question: string, hidden = false) {
  if (!hidden) return (await rl.question(question)).trim();
  // Mask typed characters for the password prompt.
  const output = rl as unknown as { _writeToOutput?: (s: string) => void; output: NodeJS.WritableStream };
  const original = output._writeToOutput;
  output._writeToOutput = (s: string) => {
    if (s.includes(question)) output.output.write(s);
    else output.output.write('*');
  };
  const answer = await rl.question(question);
  output._writeToOutput = original;
  stdout.write('\n');
  return answer;
}

async function main() {
  let email = process.env.ADMIN_EMAIL ?? '';
  let name = process.env.ADMIN_NAME ?? '';
  let password = process.env.ADMIN_PASSWORD ?? '';

  if (!email || !name || !password) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    email ||= await ask(rl, 'Administrator email: ');
    name ||= await ask(rl, 'Full name: ');
    if (!password) {
      password = await ask(rl, 'Password (min 12 chars, upper/lower case and a number): ', true);
      const confirm = await ask(rl, 'Confirm password: ', true);
      if (password !== confirm) throw new Error('Passwords do not match.');
    }
    rl.close();
  }

  email = z.email().parse(email.trim().toLowerCase());
  z.string().min(1).max(150).parse(name);
  validatePasswordStrength(password);

  await seedRolesAndPermissions();
  const role = await Role.findOne({ where: { name: 'super_admin' } });
  if (!role) throw new Error('super_admin role missing; run migrations and seed first.');

  const existing = await User.findOne({ where: { email }, paranoid: false });
  const user = existing
    ? await existing.update({ name, password_hash: await hashPassword(password), status: 'active', password_changed_at: new Date() })
    : await User.create({ name, email, password_hash: await hashPassword(password), password_changed_at: new Date() });
  if (existing?.deleted_at) await (existing as unknown as { restore: () => Promise<void> }).restore();
  await (user as unknown as { addRole: (r: Role) => Promise<void> }).addRole(role);
  console.log(`${existing ? 'Updated' : 'Created'} Super Administrator: ${email}`);
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    await sequelize.close();
    process.exit(1);
  });
