/**
 * Download user-provided Factory submenu icons and normalize to 64×64 PNG.
 * Requires: npm install sharp (dev/local). Run: node scripts/import-factory-icons.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve('C:/Projects/toyerp');
const outDir = path.join(root, 'public', 'images', 'sidebar', 'factory');
const tmpDir = path.join(root, 'scripts', '.tmp-factory-icons');

const icons = [
  { file: 'orders.png', url: 'https://i.ibb.co.com/h1B6W7n1/Orders-Purchases-icon.png' },
  { file: 'bom.png', url: 'https://i.ibb.co.com/gZCysDts/Bill-of-Materials-BOM-factory-icon.png' },
  { file: 'machine-maintenance.png', url: 'https://i.ibb.co.com/xS7F440L/Machine-Maintenance-factory-icon.avif' },
  { file: 'mold-management.png', url: 'https://i.ibb.co.com/JW5HFsk5/Mold-Management-factory-icon.webp' },
  { file: 'wastage.png', url: 'https://i.ibb.co.com/6RWz0Sd9/Wastage-factory-icon.png' },
  { file: 'packing.png', url: 'https://i.ibb.co.com/237yf28Z/Packing-factory-icon.png' },
];

const CANVAS = 64;
const MAX_ART = 62;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

function download(url, dest) {
  const script = `
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
$ok = $false
for ($i = 1; $i -le 4; $i++) {
  try {
    Invoke-WebRequest -Uri '${url.replace(/'/g, "''")}' -OutFile '${dest.replace(/'/g, "''")}' -TimeoutSec 120 -UseBasicParsing
    if ((Test-Path '${dest.replace(/'/g, "''")}') -and ((Get-Item '${dest.replace(/'/g, "''")}').Length -gt 200)) { $ok = $true; break }
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $ok) { throw 'download failed' }
`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', script], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0 || !fs.existsSync(dest) || fs.statSync(dest).size < 200) {
    process.stderr.write(result.stderr || result.stdout || '');
    throw new Error(`Download failed: ${url}`);
  }
}

async function normalizeIcon(srcPath, outPath) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels > 3 ? data[i + 3] : 255;
      const isBg = a < 8 || (r >= 245 && g >= 245 && b >= 245);
      if (!isBg) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  let pipeline = sharp(srcPath);
  if (maxX >= 0) {
    const pad = 1;
    const left = Math.max(0, minX - pad);
    const top = Math.max(0, minY - pad);
    const extractWidth = Math.min(width - left, maxX - minX + 1 + pad * 2);
    const extractHeight = Math.min(height - top, maxY - minY + 1 + pad * 2);
    pipeline = pipeline.extract({ left, top, width: extractWidth, height: extractHeight });
  }

  const art = await pipeline
    .resize(MAX_ART, MAX_ART, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.floor((CANVAS - art.info.width) / 2);
  const top = Math.floor((CANVAS - art.info.height) / 2);

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: art.data, left, top }])
    .png()
    .toFile(outPath);
}

for (const icon of icons) {
  const ext = path.extname(new URL(icon.url).pathname) || '.bin';
  const tmp = path.join(tmpDir, `${path.basename(icon.file, '.png')}${ext}`);
  const out = path.join(outDir, icon.file);
  console.log('Importing', icon.file);
  download(icon.url, tmp);
  await normalizeIcon(tmp, out);
  const size = fs.statSync(out).size;
  if (size < 200) throw new Error(`Empty output: ${icon.file}`);
  console.log(`OK ${icon.file} ${size} bytes`);
}

try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
console.log('Imported', icons.length, 'icons into', outDir);
