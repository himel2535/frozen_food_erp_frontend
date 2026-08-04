import { Suspense } from 'react';
import { SemiFinishedBomPage } from '@/lib/modules/recipes-pages';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SemiFinishedBomPage />
    </Suspense>
  );
}
