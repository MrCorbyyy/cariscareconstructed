/** Copies public/ and .next/static into the standalone bundle so `node .next/standalone/server.js` serves them. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standalone = path.join(root, '.next', 'standalone');
if (!fs.existsSync(standalone)) {
  console.log('No standalone output found; skipping asset copy.');
  process.exit(0);
}
fs.cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });
fs.cpSync(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), { recursive: true });
console.log('Copied public/ and .next/static into .next/standalone/.');
