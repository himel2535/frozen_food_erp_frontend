const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type ImgBBUploadResult = {
  url: string;
  deleteUrl?: string;
};

export class ImgBBUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImgBBUploadError';
  }
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Only JPEG, PNG, or WebP images are allowed.';
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be 5 MB or smaller.';
  }
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new ImgBBUploadError('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToImgBB(file: File): Promise<ImgBBUploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) throw new ImgBBUploadError(validationError);

  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY?.trim();
  if (!apiKey) {
    throw new ImgBBUploadError('ImgBB API key is missing. Set NEXT_PUBLIC_IMGBB_API_KEY in .env.local.');
  }

  const base64 = await fileToBase64(file);
  const body = new FormData();
  body.append('image', base64);

  let response: Response;
  try {
    response = await fetch(`${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body,
    });
  } catch {
    throw new ImgBBUploadError('Network error while uploading image.');
  }

  let json: {
    success?: boolean;
    error?: { message?: string };
    data?: { url?: string; display_url?: string; delete_url?: string };
  };
  try {
    json = await response.json();
  } catch {
    throw new ImgBBUploadError('Invalid response from ImgBB.');
  }

  if (!response.ok || !json.success) {
    throw new ImgBBUploadError(json.error?.message || 'Image upload failed.');
  }

  const url = json.data?.display_url || json.data?.url;
  if (!url) throw new ImgBBUploadError('ImgBB did not return an image URL.');

  return {
    url,
    deleteUrl: json.data?.delete_url,
  };
}
