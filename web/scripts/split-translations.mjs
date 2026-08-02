/**
 * Split translations.ts into en.ts and bn.ts for lazy loading.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'lib', 'i18n', 'translations.ts');
const outDir = path.join(__dirname, '..', 'lib', 'i18n', 'translations');
const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);

const enBody = lines.slice(3, 342).join('\n');
const bnBody = lines.slice(345, 1236).join('\n');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'en.ts'),
  `export const en = {\n${enBody}\n} as Record<string, string>;\n`,
  'utf8',
);
fs.writeFileSync(
  path.join(outDir, 'bn.ts'),
  `export const bn = {\n${bnBody}\n} as Record<string, string>;\n`,
  'utf8',
);
console.log('Split translations into en.ts and bn.ts');
