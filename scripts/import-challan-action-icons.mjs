/**
 * Download classic multi-color Icons8 Color action icons (topic-wise: eye, pencil, printer)
 * and normalize to 128×128 PNG for Delivery Challan action buttons.
 * Requires: sharp. Run: node scripts/import-challan-action-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'images', 'icons', 'actions');
const tmpDir = path.join(root, 'scripts', '.tmp-challan-action-icons');

const icons = [
  { file: 'view.png', url: 'https://img.icons8.com/color/128/visible--v1.png' },
  { file: 'edit.png', url: 'https://img.icons8.com/color/128/edit--v1.png' },
  { file: 'print.png', url: 'https://img.icons8.com/color/128/print.png' },
];

const CANVAS = 128;
const MAX_ART = 112;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

async function download(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'image/png,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function normalizeIcon(srcPath, outPath) {
  const art = await sharp(srcPath)
    .ensureAlpha()
    .resize(MAX_ART, MAX_ART, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.floor((CANVAS - art.info.width) / 2);
  const top = Math.floor((CANVAS - art.info.height) / 2);

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: art.data, left, top }])
    .png()
    .toFile(outPath);
}

for (const icon of icons) {
  const tmp = path.join(tmpDir, `${path.basename(icon.file, '.png')}.png`);
  const out = path.join(outDir, icon.file);
  console.log('Importing', icon.file);
  await download(icon.url, tmp);
  await normalizeIcon(tmp, out);
  const size = fs.statSync(out).size;
  if (size < 200) throw new Error(`Empty output: ${icon.file}`);
  console.log(`OK ${icon.file} ${size} bytes`);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('Imported', icons.length, 'icons into', outDir);
