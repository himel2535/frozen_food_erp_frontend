'use client';

import { useCallback, useRef } from 'react';
import type { PendingImageUpload } from '@/lib/services/cloudinary-service';
import {
  attachBackgroundImageLater,
  type BackgroundImagePatchResult,
} from '@/lib/services/background-image-attach';

export function useCreateFirstImage(
  moduleName: string,
  patchImage: (
    recordId: string,
    imageUrl: string,
    imagePublicId: string,
  ) => Promise<BackgroundImagePatchResult>,
  onAttached?: () => void | Promise<void>,
) {
  const pendingRef = useRef<Promise<PendingImageUpload | null> | null>(null);
  const patchRef = useRef(patchImage);
  patchRef.current = patchImage;
  const onAttachedRef = useRef(onAttached);
  onAttachedRef.current = onAttached;

  const onPendingUpload = useCallback((promise: Promise<PendingImageUpload | null> | null) => {
    pendingRef.current = promise;
  }, []);

  const attachAfterSave = useCallback((
    recordId: string | null | undefined,
    savedImageUrl: string,
  ) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!recordId || !pending) return;
    attachBackgroundImageLater({
      recordId: String(recordId),
      savedImageUrl,
      pending,
      patchImage: (id, url, publicId) => patchRef.current(id, url, publicId),
      onAttached: () => onAttachedRef.current?.(),
      moduleName,
    });
  }, [moduleName]);

  return { pendingRef, onPendingUpload, attachAfterSave };
}
