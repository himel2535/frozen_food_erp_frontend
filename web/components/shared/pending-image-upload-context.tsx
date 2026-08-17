'use client';

import { createContext, useContext } from 'react';
import type { PendingImageUpload } from '@/lib/services/cloudinary-service';

export type PendingImageSetter = (
  promise: Promise<PendingImageUpload | null> | null,
) => void;

export const PendingImageUploadContext = createContext<PendingImageSetter | null>(null);

export function usePendingImageUploadContext() {
  return useContext(PendingImageUploadContext);
}
