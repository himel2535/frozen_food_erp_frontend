'use client';

import { AppToastHost } from '@/components/shared/AppToastHost';
import { AppConfirmDialog } from '@/components/shared/AppConfirmDialog';

/** Global toast + confirm hosts — mounted in root layout so /login can show feedback. */
export function AppFeedbackProviders() {
  return (
    <>
      <AppToastHost />
      <AppConfirmDialog />
    </>
  );
}
