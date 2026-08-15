const MAX_WIDTH = 1200;
const MAX_HEIGHT = 400;
const TARGET_BYTES = 300 * 1024;
const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.08;
const MIN_SCALE = 0.5;
const SCALE_STEP = 0.85;

export type CompressedSignatureImage = {
  blob: Blob;
  dataUrl: string;
  mimeType: string;
};

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

function getScaledDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('compress_failed'));
    reader.readAsDataURL(blob);
  });
}

function pickOutputMimeType(sourceType: string, hasAlpha: boolean): string {
  if (sourceType === 'image/webp') return 'image/webp';
  if (sourceType === 'image/jpeg' || sourceType === 'image/jpg') return 'image/jpeg';
  if (sourceType === 'image/png' && hasAlpha) return 'image/png';
  return 'image/jpeg';
}

async function renderCompressedBlob(
  image: HTMLImageElement,
  mimeType: string,
  scale: number,
  quality: number,
): Promise<Blob> {
  const scaled = getScaledDimensions(
    image.naturalWidth,
    image.naturalHeight,
    Math.round(MAX_WIDTH * scale),
    Math.round(MAX_HEIGHT * scale),
  );

  const canvas = document.createElement('canvas');
  canvas.width = scaled.width;
  canvas.height = scaled.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('compress_failed');

  if (mimeType !== 'image/png') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, scaled.width, scaled.height);
  }

  ctx.drawImage(image, 0, 0, scaled.width, scaled.height);

  if (mimeType === 'image/png') {
    return canvasToBlob(canvas, mimeType);
  }

  return canvasToBlob(canvas, mimeType, quality);
}

export async function compressSignatureImage(file: File): Promise<CompressedSignatureImage> {
  const image = await loadImageFromFile(file);
  const outputMimeType = pickOutputMimeType(file.type, file.type === 'image/png');

  let scale = 1;
  let quality = 0.82;
  let bestBlob: Blob | null = null;

  while (scale >= MIN_SCALE) {
    while (quality >= MIN_QUALITY) {
      const blob = await renderCompressedBlob(image, outputMimeType, scale, quality);
      bestBlob = blob;
      if (blob.size <= TARGET_BYTES) {
        const dataUrl = await blobToDataUrl(blob);
        return { blob, dataUrl, mimeType: outputMimeType };
      }
      quality -= QUALITY_STEP;
    }
    scale *= SCALE_STEP;
    quality = 0.82;
  }

  if (!bestBlob) throw new Error('compress_failed');

  const dataUrl = await blobToDataUrl(bestBlob);
  return { blob: bestBlob, dataUrl, mimeType: outputMimeType };
}
