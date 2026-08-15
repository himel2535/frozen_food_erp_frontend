import { compressSignatureImage } from '@/lib/utils/compress-signature-image';

export const SIGNATURE_MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const SIGNATURE_MAX_BYTES = 1024 * 1024;

export const SIGNATURE_ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export const SIGNATURE_ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

export type SignatureUploadError = 'invalid' | 'too_large' | 'read_failed' | 'compress_failed';

function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return name.slice(dot).toLowerCase();
}

function resolveSignatureMimeType(file: File): string | null {
  const normalizedType = file.type.trim().toLowerCase();
  if (SIGNATURE_ALLOWED_TYPES.includes(normalizedType as (typeof SIGNATURE_ALLOWED_TYPES)[number])) {
    return normalizedType === 'image/jpg' ? 'image/jpeg' : normalizedType;
  }

  const extension = getFileExtension(file.name);
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  return null;
}

export function validateSignatureFile(file: File): { ok: true; mimeType: string } | { ok: false; error: SignatureUploadError } {
  const mimeType = resolveSignatureMimeType(file);
  if (!mimeType) {
    return { ok: false, error: 'invalid' };
  }
  if (file.size > SIGNATURE_MAX_INPUT_BYTES) {
    return { ok: false, error: 'too_large' };
  }
  return { ok: true, mimeType };
}

function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
    && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim(),
  );
}

async function tryUploadToCloudinary(blob: Blob, fileName: string): Promise<string | null> {
  if (!isCloudinaryConfigured()) return null;

  try {
    const { uploadImageToCloudinary } = await import('@/lib/services/cloudinary-service');
    const file = new File([blob], fileName, { type: blob.type || 'image/png' });
    const result = await uploadImageToCloudinary(file);
    return result.url;
  } catch {
    return null;
  }
}

export async function readSignatureFile(file: File): Promise<string> {
  const validation = validateSignatureFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  let compressed;
  try {
    const normalizedFile = validation.mimeType !== file.type
      ? new File([file], file.name, { type: validation.mimeType })
      : file;
    compressed = await compressSignatureImage(normalizedFile);
  } catch {
    throw new Error('compress_failed');
  }

  const cloudinaryUrl = await tryUploadToCloudinary(compressed.blob, file.name);
  if (cloudinaryUrl) return cloudinaryUrl;

  if (!compressed.dataUrl) {
    throw new Error('read_failed');
  }

  if (compressed.blob.size > SIGNATURE_MAX_BYTES) {
    throw new Error('too_large');
  }

  return compressed.dataUrl;
}
