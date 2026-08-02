/**
 * Adds 'use client' to tenant pages using lazyRoute().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tenantDir = path.join(__dirname, '..', 'app', '(tenant)');

function findPageFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findPageFiles(full));
    else if (entry.name === 'page.tsx') results.push(full);
  }
  return results;
}

let updated = 0;
for (const file of findPageFiles(tenantDir)) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('lazyRoute')) continue;
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) continue;
  fs.writeFileSync(file, `'use client';\n\n${content}`, 'utf8');
  updated += 1;
  console.log(`Client boundary: ${path.relative(path.join(__dirname, '..'), file)}`);
}
console.log(`Updated ${updated} pages.`);
