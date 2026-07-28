/**
 * Normalize generated dashboard icons to 64×64 PNG.
 * Run: node scripts/normalize-dashboard-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assets = 'C:/Users/hookm/.cursor/projects/c-Projects-toyerp/assets';
const outDir = 'C:/Projects/toyerp/public/images/dashboard/icons';
const CANVAS = 64;
const MAX_ART = 62;

const icons = [
  ['sales-trend-raw.png', 'sales-trend.png'],
  ['revenue-analytics-raw.png', 'revenue-analytics.png'],
  ['notifications-raw.png', 'notifications.png'],
  ['top-products-raw.png', 'top-products.png'],
  ['recent-invoices-raw.png', 'recent-invoices.png'],
  ['activity-feed-raw.png', 'activity-feed.png'],
  ['notif-sales-order-raw.png', 'notif-sales-order.png'],
  ['notif-payment-raw.png', 'notif-payment.png'],
  ['notif-low-stock-raw.png', 'notif-low-stock.png'],
];

fs.mkdirSync(outDir, { recursive: true });

async function normalizeIcon(srcPath, outPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
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
    const right = Math.min(width - 1, maxX + pad);
    const bottom = Math.min(height - 1, maxY + pad);
    pipeline = pipeline.extract({
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    });
  }

  const trimmed = await pipeline.png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const scale = Math.min(MAX_ART / meta.width, MAX_ART / meta.height);
  const w = Math.max(1, Math.round(meta.width * scale));
  const h = Math.max(1, Math.round(meta.height * scale));
  const resized = await sharp(trimmed).resize(w, h, { fit: 'inside' }).png().toBuffer();
  const left = Math.floor((CANVAS - w) / 2);
  const top = Math.floor((CANVAS - h) / 2);

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outPath);

  console.log('OK', path.basename(outPath), `${w}x${h}`);
}

for (const [src, dest] of icons) {
  const srcPath = path.join(assets, src);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source: ${srcPath}`);
  }
  await normalizeIcon(srcPath, path.join(outDir, dest));
}

console.log('Done.');
