/**
 * Download user-provided Sales & CRM submenu icons and normalize to 64×64 PNG.
 * Requires: npm install sharp (dev/local). Run: node scripts/import-sales-crm-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve('C:/Projects/toyerp');
const outDir = path.join(root, 'public', 'images', 'sidebar', 'sales-crm');
const tmpDir = path.join(root, 'scripts', '.tmp-crm-icons');

const icons = [
  { file: 'customers.png', url: 'https://i.ibb.co.com/svQBGz2K/customer-subsidebar-image-icon.jpg' },
  { file: 'leads.png', url: 'https://i.ibb.co.com/6cQDnVqL/Leads-subsidebar-image-icon.png' },
  { file: 'deals.png', url: 'https://i.ibb.co.com/6JDpNHtG/Deals-Pipeline-subsidebar-image-icon.png' },
  { file: 'quotations.png', url: 'https://i.ibb.co.com/TMF6kNFP/Quotations-subsidebar-image-icon.png' },
  { file: 'deliveries.png', url: 'https://i.ibb.co.com/spnBgvDv/Delivery-Challan-subsidebar-image-icon.png' },
  { file: 'dispatch.png', url: 'https://i.ibb.co.com/ccdvmCdC/Dispatch-subsidebar-image-icon.jpg' },
  { file: 'invoices.png', url: 'https://i.ibb.co.com/cmSDqYN/Invoicessubsidebar-image-icon.png' },
  { file: 'payments.png', url: 'https://i.ibb.co.com/nsGdCFGH/Payments-subsidebar-image-icon.png' },
  { file: 'returns.png', url: 'https://i.ibb.co.com/396v62hV/Returns-subsidebar-image-icon.jpg' },
  { file: 'pos.png', url: 'https://i.ibb.co.com/FbpJkKgz/POS-subsidebar-image-icon.avif' },
  { file: 'complaints.png', url: 'https://i.ibb.co.com/5pDM3Ch/Complaints-subsidebar-image-icon.png' },
];

const CANVAS = 64;
const MAX_ART = 62;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

async function download(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
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
