const MAX_EDGE = 1280;
const TARGET_BYTES = 400 * 1024;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.08;
const MIN_SCALE = 0.5;
const SCALE_STEP = 0.85;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('compress_failed'));
    };
    image.src = objectUrl;
  });
}

function scaledSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  const ratio = Math.min(maxEdge / longest, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('compress_failed'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function pickOutputMimeType(sourceType: string): string {
  if (sourceType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function renameForMime(name: string, mimeType: string): string {
  const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';
  return name.replace(/\.[^.]+$/u, '') + ext;
}

async function renderBlob(
  image: HTMLImageElement,
  mimeType: string,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const size = scaledSize(image.naturalWidth, image.naturalHeight, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('compress_failed');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.drawImage(image, 0, 0, size.width, size.height);
  return canvasToBlob(canvas, mimeType, quality);
}

/** Resize/compress a photo for Cloudinary. Already-small files are returned unchanged. */
export async function compressImageFile(file: File): Promise<File> {
  if (typeof document === 'undefined') return file;

  try {
    const image = await loadImageFromFile(file);
    const withinDim = image.naturalWidth <= MAX_EDGE && image.naturalHeight <= MAX_EDGE;
    if (withinDim && file.size <= TARGET_BYTES) return file;

    const mimeType = pickOutputMimeType(file.type);
    let maxEdge = MAX_EDGE;
    let quality = 0.82;
    let bestBlob: Blob | null = null;

    while (maxEdge >= MAX_EDGE * MIN_SCALE) {
      while (quality >= MIN_QUALITY) {
        const blob = await renderBlob(image, mimeType, maxEdge, quality);
        bestBlob = blob;
        if (blob.size <= TARGET_BYTES) {
          if (blob.size >= file.size && withinDim) return file;
          return new File([blob], renameForMime(file.name, mimeType), { type: mimeType, lastModified: Date.now() });
        }
        quality -= QUALITY_STEP;
      }
      maxEdge = Math.round(maxEdge * SCALE_STEP);
      quality = 0.82;
    }

    if (!bestBlob) return file;
    if (bestBlob.size >= file.size && withinDim) return file;
    return new File([bestBlob], renameForMime(file.name, mimeType), { type: mimeType, lastModified: Date.now() });
  } catch {
    return file;
  }
}
