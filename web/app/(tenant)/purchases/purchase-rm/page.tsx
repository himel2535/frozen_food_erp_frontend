import { Suspense } from 'react';
import { PurchaseRmPage } from '@/components/modules/purchases/PurchaseRmPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PurchaseRmPage />
    </Suspense>
  );
}
