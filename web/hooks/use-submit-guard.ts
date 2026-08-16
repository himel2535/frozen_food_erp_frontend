'use client';

import { useCallback, useRef, useState } from 'react';

export function useSubmitGuard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const savingRef = useRef(false);

  const guardSubmit = useCallback(async (fn: () => void | Promise<void>) => {
    if (isSubmitting || savingRef.current) return;
    savingRef.current = true;
    setIsSubmitting(true);
    try {
      await Promise.resolve(fn());
    } finally {
      savingRef.current = false;
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  return { isSubmitting, guardSubmit, savingRef };
}
