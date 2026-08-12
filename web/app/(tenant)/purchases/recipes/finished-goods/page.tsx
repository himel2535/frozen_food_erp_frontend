import { Suspense } from 'react';
import { ModuleRouteSkeleton } from '@/components/shared/ModuleListSkeleton';
import { FinishedGoodsBomPage } from '@/lib/modules/recipes-pages';

export default function Page() {
  return (
    <Suspense fallback={<ModuleRouteSkeleton />}>
      <FinishedGoodsBomPage />
    </Suspense>
  );
}
