#!/usr/bin/env node
/** Regenerates lib/ui/iconify-chrome.json from sidebar + dashboard chrome icon names. */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const fluent = require('@iconify-json/fluent-color/icons.json');
const flat = require('@iconify-json/flat-color-icons/icons.json');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sidebar = fs.readFileSync(path.join(root, 'lib/navigation/tenant-sidebar.ts'), 'utf8');
const extras = [
  'flat-color-icons:currency-exchange',
  'fluent-color:person-24',
  'fluent-color:alert-badge-24',
  'flat-color-icons:shipped',
  'fluent-color:people-interwoven-24',
  'fluent-color:clock-24',
  'fluent-color:database-24',
  'fluent-color:globe-24',
  'fluent-color:alert-24',
  'fluent-color:toolbox-24',
  'fluent-color:warning-24',
  'fluent-color:checkmark-circle-24',
  'fluent-color:building-store-24',
  'fluent-color:chat-24',
  'fluent-color:mail-24',
  'fluent-color:phone-24',
  'fluent-color:comment-multiple-24',
  'fluent-color:data-trending-24',
  'fluent-color:chart-multiple-24',
  'fluent-color:document-folder-24',
  'fluent-color:ribbon-24',
  'fluent-color:receipt-24',
  'fluent-color:history-24',
];

const names = new Set(extras);
for (const m of sidebar.matchAll(/iconifyIcon: '([^']+)'/g)) names.add(m[1]);

const by = { 'fluent-color': {}, 'flat-color-icons': {} };
const missing = [];
for (const full of names) {
  const [prefix, name] = full.split(':');
  if (!by[prefix]) continue;
  const src = prefix === 'fluent-color' ? fluent : flat;
  if (src.icons[name]) by[prefix][name] = src.icons[name];
  else missing.push(full);
}

const out = {
  fluentColor: { prefix: 'fluent-color', width: fluent.width, height: fluent.height, icons: by['fluent-color'] },
  flatColorIcons: { prefix: 'flat-color-icons', width: flat.width, height: flat.height, icons: by['flat-color-icons'] },
};
const dest = path.join(root, 'lib/ui/iconify-chrome.json');
fs.writeFileSync(dest, JSON.stringify(out));
if (missing.length) {
  console.error('Missing icons:', missing.join(', '));
  process.exit(1);
}
console.log(
  `Wrote ${dest} (${Object.keys(by['fluent-color']).length} fluent-color, ${Object.keys(by['flat-color-icons']).length} flat-color-icons)`,
);
