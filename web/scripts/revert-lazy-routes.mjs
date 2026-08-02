/**
 * Reverts lazyRoute() wrappers back to direct imports in tenant page.tsx files.
 * Usage: node scripts/revert-lazy-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const tenantDir = path.join(root, 'app', '(tenant)');

function findPageFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findPageFiles(full));
    else if (entry.name === 'page.tsx') results.push(full);
  }
  return results;
}

function transformPage(content, filePath) {
  if (!content.includes('lazyRoute')) return null;

  const lazyMatch = content.match(
    /const\s+(\w+)\s*=\s*lazyRoute\(\s*\n?\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\.then\(\(m\)\s*=>\s*\(\{\s*default:\s*m\.(\w+)\s*\}\)\),\s*\n?\s*'[^']*',\s*\n?\s*\);/,
  );
  if (!lazyMatch) {
    console.warn(`Skip (pattern mismatch): ${filePath}`);
    return null;
  }

  const [, componentName, modulePath, exportName] = lazyMatch;
  if (componentName !== exportName) {
    console.warn(`Skip (name mismatch): ${filePath}`);
    return null;
  }

  let body = content
    .replace(/^'use client';\s*\n?/m, '')
    .replace(/import\s*\{\s*lazyRoute\s*\}\s*from\s*['"]@\/lib\/ui\/lazy-route['"];?\s*\n?/m, '')
    .replace(lazyMatch[0], '')
    .trimStart();

  const directImport = `import { ${componentName} } from '${modulePath}';\n\n`;
  return `${directImport}${body.trimEnd()}\n`;
}

const files = findPageFiles(tenantDir);
let updated = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  const original = fs.readFileSync(file, 'utf8');
  const next = transformPage(original, rel);
  if (next && next !== original) {
    fs.writeFileSync(file, next, 'utf8');
    updated += 1;
    console.log(`Reverted: ${rel}`);
  }
}

console.log(`\nDone. Reverted ${updated} of ${files.length} route pages.`);
