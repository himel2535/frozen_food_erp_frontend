'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/ui/feedback';
import { Footer } from '@/components/layout/Footer';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { updateSupplier } from '@/lib/services/purchases-service';
import { getSupplierDetailProfile } from '@/lib/services/suppliers-service';
import { SupplierDetailHeader, SupplierDetailHeaderActions } from './SupplierDetailHeader';
import { SupplierDetailMetrics } from './SupplierDetailMetrics';
import { SupplierCreditBar } from './SupplierCreditBar';
import { SupplierDetailTabs, type SupplierDetailTabId } from './SupplierDetailTabs';
import { SupplierOverviewTab } from './SupplierOverviewTab';
import { SupplierPlaceholderTab } from './SupplierPlaceholderTab';

const PLACEHOLDER_LABELS: Record<Exclude<SupplierDetailTabId, 'overview'>, string> = {
  ledger: 'Ledger',
  purchases: 'Purchases',
  bills: 'Bills',
  payments: 'Payments',
  returns: 'Returns',
  items: 'Items',
  documents: 'Documents',
  activity: 'Activity',
};

export function SupplierDetailPage({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [, bump] = useState(0);
  const [activeTab, setActiveTab] = useState<SupplierDetailTabId>('overview');

  useChromeSuppressed(true);

  const profile = useMemo(
    () => (supplierId ? getSupplierDetailProfile(appState, supplierId) : null),
    [appState, supplierId, bump],
  );

  const handleDeactivate = () => {
    if (!profile) return;
    updateSupplier(appState, profile.supplier.id, { status: 'inactive' });
    saveAppState();
    bump((n) => n + 1);
    toast.success('Supplier deactivated', {
      module: 'Suppliers',
      description: `${profile.supplier.name} marked as inactive.`,
    });
  };

  if (!profile) {
    return (
      <>
        <ChildPageShell
          title="Supplier not found"
          subtitle={`The supplier ID "${supplierId}" does not exist or was removed.`}
          onBack={() => router.push('/purchases/suppliers')}
          backLabel="Back to Suppliers"
        >
          <div className="premium-card premium-shadow p-8 text-center" />
        </ChildPageShell>
        <Footer />
      </>
    );
  }

  const { supplier } = profile;

  return (
    <>
      <ChildPageShell
        title={supplier.name}
        subtitle={`${supplier.code} · ${profile.categoryLabel}`}
        onBack={() => router.push('/purchases/suppliers')}
        backLabel="Back to Suppliers"
        actions={(
          <SupplierDetailHeaderActions profile={profile} onDeactivate={handleDeactivate} />
        )}
      >
        <SupplierDetailHeader profile={profile} />
        <SupplierDetailMetrics metrics={profile.metrics} />
        <SupplierCreditBar profile={profile} />
        <SupplierDetailTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && <SupplierOverviewTab profile={profile} />}
        {activeTab !== 'overview' && (
          <SupplierPlaceholderTab label={PLACEHOLDER_LABELS[activeTab]} />
        )}
      </ChildPageShell>
      <Footer />
    </>
  );
}
