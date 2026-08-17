'use client';

import { Loader2 } from 'lucide-react';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

export function SubmitBusyLabel({ busy, idle }: { busy: boolean; idle: ReactNode }) {
  if (!busy) return idle;
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
      Saving…
    </span>
  );
}

export function useSubmitGuard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [held, setHeld] = useState(false);
  const savingRef = useRef(false);
  const heldRef = useRef(false);

  const holdAfterSuccess = useCallback(() => {
    heldRef.current = true;
    savingRef.current = true;
    setHeld(true);
  }, []);

  const guardSubmit = useCallback(async (fn: () => void | Promise<void>) => {
    if (savingRef.current || heldRef.current) return;
    savingRef.current = true;
    flushSync(() => {
      setIsSubmitting(true);
    });
    try {
      await Promise.resolve(fn());
    } finally {
      if (!heldRef.current) {
        savingRef.current = false;
        setIsSubmitting(false);
      }
    }
  }, []);

  return {
    isSubmitting: isSubmitting || held,
    guardSubmit,
    savingRef,
    holdAfterSuccess,
  };
}
