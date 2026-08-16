import type { PendingImageUpload } from '@/lib/services/cloudinary-service';
import { toast } from '@/lib/ui/feedback';

export type BackgroundImagePatchResult = { ok: true } | { ok: false; error?: string };

export type AttachBackgroundImageLaterOptions = {
  recordId: string;
  savedImageUrl: string;
  pending: Promise<PendingImageUpload | null>;
  patchImage: (
    recordId: string,
    imageUrl: string,
    imagePublicId: string,
  ) => Promise<BackgroundImagePatchResult>;
  onAttached?: () => void | Promise<void>;
  moduleName: string;
};

/** Create-first pattern: patch image fields after background upload completes. */
export function attachBackgroundImageLater({
  recordId,
  savedImageUrl,
  pending,
  patchImage,
  onAttached,
  moduleName,
}: AttachBackgroundImageLaterOptions): void {
  void pending.then(async (uploaded) => {
    if (!uploaded?.url || uploaded.url === savedImageUrl) return;
    const patched = await patchImage(recordId, uploaded.url, uploaded.publicId);
    if (!patched.ok) {
      toast.error(`${moduleName} saved`, {
        module: moduleName,
        description: 'The photo could not be attached.',
      });
      return;
    }
    await onAttached?.();
  });
}
