/**
 * @deprecated Use `node scripts/generate-ported-pages.mjs` instead.
 * Kept for backwards compatibility — delegates to ported page generator.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const result = spawnSync(process.execPath, [path.join(__dirname, 'generate-ported-pages.mjs')], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
});

process.exit(result.status ?? 1);
