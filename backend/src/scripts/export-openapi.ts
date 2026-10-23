/**
 * Writes the OpenAPI document to docs/openapi.json (or the path given as the first argument),
 * e.g. for import into Postman/Insomnia or for publishing without running the API.
 *
 *   npm run docs:openapi
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildOpenApiSpec } from '../docs/openapi';

const out = path.resolve(process.argv[2] ?? path.join(__dirname, '..', '..', '..', 'docs', 'openapi.json'));
const spec = buildOpenApiSpec();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote ${Object.keys(spec.paths).length} paths to ${out}`);
process.exit(0);
