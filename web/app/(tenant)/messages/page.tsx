import { Suspense } from 'react';
import { ModuleRouteSkeleton } from '@/components/shared/ModuleListSkeleton';
import { MessagesPage } from '@/components/modules/messages/MessagesPage';

export default function MessagesRoutePage() {
  return (
    <Suspense fallback={<ModuleRouteSkeleton />}>
      <MessagesPage />
    </Suspense>
  );
}
