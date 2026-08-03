'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/ui/feedback';
import { Footer } from '@/components/layout/Footer';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { updateSupplier } from '@/lib/services/purchases-service';
import { getSupplierDetailProfile } from '@/lib/services/suppliers-service';
import { SupplierDetailHeader } from './SupplierDetailHeader';
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
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [, bump] = useState(0);
  const [activeTab, setActiveTab] = useState<SupplierDetailTabId>('overview');

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
      <div className={MODULE_LIST_SHELL}>
        <div className="premium-card premium-shadow p-8 text-center space-y-4 max-w-lg mx-auto mt-12">
          <h2 className="text-lg font-extrabold text-slate-900">Supplier not found</h2>
          <p className="text-xs text-slate-500">
            The supplier ID &quot;{supplierId}&quot; does not exist or was removed.
          </p>
          <Link
            href="/purchases/suppliers"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Suppliers
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={MODULE_LIST_SHELL}>
      <SupplierDetailHeader profile={profile} onDeactivate={handleDeactivate} />
      <SupplierDetailMetrics metrics={profile.metrics} />
      <SupplierCreditBar profile={profile} />
      <SupplierDetailTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && <SupplierOverviewTab profile={profile} />}
      {activeTab !== 'overview' && (
        <SupplierPlaceholderTab label={PLACEHOLDER_LABELS[activeTab]} />
      )}

      <Footer />
    </div>
  );
}
