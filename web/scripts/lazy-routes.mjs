/**
 * Converts tenant route page.tsx files to use lazyRoute() for code splitting.
 * Usage: node scripts/lazy-routes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const tenantDir = path.join(root, 'app', '(tenant)');

function titleCase(name) {
  return name
    .replace(/Page$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function loadingLabel(componentName) {
  const label = titleCase(componentName);
  return label ? `Loading ${label}...` : 'Loading module...';
}

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
  if (content.includes('lazyRoute')) return null;

  const importMatch = content.match(
    /^import\s*\{\s*(\w+)\s*\}\s*from\s*['"]([^'"]+)['"];?\s*$/m,
  );
  if (!importMatch) return null;

  const [, componentName, modulePath] = importMatch;
  const label = loadingLabel(componentName);

  let body = content.slice(importMatch.index + importMatch[0].length);
  body = body.replace(/^import\s*\{\s*Suspense\s*\}\s*from\s*['"]react['"];?\s*\n?/m, '');

  const lazyBlock = `import { lazyRoute } from '@/lib/ui/lazy-route';

const ${componentName} = lazyRoute(
  () => import('${modulePath}').then((m) => ({ default: m.${componentName} })),
  '${label}',
);
`;

  const jsxSelfClosing = new RegExp(`<${componentName}\\s*/>`);
  const jsxWithProps = new RegExp(`<${componentName}([^>]*)\\/>`);
  const jsxOpenClose = new RegExp(`<${componentName}\\s*>\\s*</${componentName}>`);

  body = body.replace(/<Suspense[^>]*>\s*/g, '');
  body = body.replace(/\s*<\/Suspense>/g, '');

  if (!jsxSelfClosing.test(body) && !jsxWithProps.test(body) && !jsxOpenClose.test(body)) {
    console.warn(`Skip (no JSX usage): ${filePath}`);
    return null;
  }

  return `${lazyBlock}\n${body.trimStart()}\n`;
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
    console.log(`Updated: ${rel}`);
  }
}

console.log(`\nDone. Updated ${updated} of ${files.length} route pages.`);
