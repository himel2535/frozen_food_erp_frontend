const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type CloudinaryUploadResult = {
  url: string;
  publicId?: string;
};

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudinaryUploadError';
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

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) throw new CloudinaryUploadError(validationError);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new CloudinaryUploadError(
      'Cloudinary config is missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in web/.env.local.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new CloudinaryUploadError('Network error while uploading image.');
  }

  let json: {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };
  try {
    json = await response.json();
  } catch {
    throw new CloudinaryUploadError('Invalid response from Cloudinary.');
  }

  if (!response.ok || json.error) {
    throw new CloudinaryUploadError(json.error?.message || 'Image upload failed.');
  }

  if (!json.secure_url) {
    throw new CloudinaryUploadError('Cloudinary did not return an image URL.');
  }

  return {
    url: json.secure_url,
    publicId: json.public_id,
  };
}
