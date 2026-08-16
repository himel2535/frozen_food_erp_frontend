'use client';

import { useCallback } from 'react';
import {
  attachBackgroundImageLater,
  type AttachBackgroundImageLaterOptions,
} from '@/lib/services/background-image-attach';

/** Stable callback wrapper for pages that attach images after create. */
export function useBackgroundImageAttach() {
  return useCallback(
    (options: AttachBackgroundImageLaterOptions) => attachBackgroundImageLater(options),
    [],
  );
}
