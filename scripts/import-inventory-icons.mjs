/**
 * Download user-provided Inventory submenu icons and normalize to 64×64 PNG.
 * Requires: npm install sharp (dev/local). Run: node scripts/import-inventory-icons.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve('C:/Projects/toyerp');
const outDir = path.join(root, 'public', 'images', 'sidebar', 'inventory');
const tmpDir = path.join(root, 'scripts', '.tmp-inventory-icons');

const icons = [
  { file: 'products.png', url: 'https://i.ibb.co.com/C5wgt2Yg/Products-subbanner-inventory-icon.png' },
  { file: 'stock-in.png', url: 'https://i.ibb.co.com/xq0VcwF2/Stock-In-subbanner-inventory-icon.png' },
  { file: 'stock-out.png', url: 'https://i.ibb.co.com/TxwgWX12/Stock-Out-subbanner-inventory-icon.png' },
  { file: 'transfers.png', url: 'https://i.ibb.co.com/TMh74Rsb/Stock-Transfers-subbanner-inventory-icon.png' },
  { file: 'adjustments.png', url: 'https://i.ibb.co.com/FLSPwTdq/Stock-Correction-subbanner-inventory-icon.png' },
  { file: 'warehouses.png', url: 'https://i.ibb.co.com/6RwSn1sS/Warehouse-subbanner-inventory-icon.png' },
  { file: 'categories.png', url: 'https://i.ibb.co.com/84bDJ3N6/Categories-subbanner-inventory-icon.png' },
  { file: 'units.png', url: 'https://i.ibb.co.com/Y7RxjBcJ/Units-subbanner-inventory-icon.png' },
];

const CANVAS = 64;
const MAX_ART = 62;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

function download(url, dest) {
  // Node fetch often times out on ImgBB from this network; PowerShell + TLS1.2 is more reliable.
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

/**
 * Trim near-white / transparent padding, then fit into 64×64 white canvas.
 */
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
  await download(icon.url, tmp);
  await normalizeIcon(tmp, out);
  const size = fs.statSync(out).size;
  if (size < 200) throw new Error(`Empty output: ${icon.file}`);
  console.log(`OK ${icon.file} ${size} bytes`);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('Imported', icons.length, 'icons into', outDir);
