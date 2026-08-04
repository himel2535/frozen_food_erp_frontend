import { Suspense } from 'react';
import { FinishedGoodsBomPage } from '@/lib/modules/recipes-pages';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FinishedGoodsBomPage />
    </Suspense>
  );
}
