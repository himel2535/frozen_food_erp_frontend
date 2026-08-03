export const SIGNATURE_MAX_BYTES = 1024 * 1024;

export const SIGNATURE_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type SignatureUploadError = 'invalid' | 'too_large';

export function validateSignatureFile(file: File): { ok: true } | { ok: false; error: SignatureUploadError } {
  if (!SIGNATURE_ALLOWED_TYPES.includes(file.type as (typeof SIGNATURE_ALLOWED_TYPES)[number])) {
    return { ok: false, error: 'invalid' };
  }
  if (file.size > SIGNATURE_MAX_BYTES) {
    return { ok: false, error: 'too_large' };
  }
  return { ok: true };
}

export function readSignatureFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const validation = validateSignatureFile(file);
    if (!validation.ok) {
      reject(new Error(validation.error));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}
