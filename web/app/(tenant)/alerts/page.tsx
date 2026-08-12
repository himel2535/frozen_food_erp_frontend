import { Suspense } from 'react';
import { ModuleRouteSkeleton } from '@/components/shared/ModuleListSkeleton';
import { BusinessAlertsPage } from '@/components/modules/alerts/BusinessAlertsPage';

export default function AlertsRoutePage() {
  return (
    <Suspense fallback={<ModuleRouteSkeleton />}>
      <BusinessAlertsPage />
    </Suspense>
  );
}
