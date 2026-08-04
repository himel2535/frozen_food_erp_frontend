import { Suspense } from 'react';
import { BusinessAlertsPage } from '@/components/modules/alerts/BusinessAlertsPage';

export default function AlertsRoutePage() {
  return (
    <Suspense fallback={null}>
      <BusinessAlertsPage />
    </Suspense>
  );
}
