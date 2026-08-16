'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/ui/feedback';
import { Footer } from '@/components/layout/Footer';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { fetchResourceById, updateResource } from '@/lib/services/api-resource-service';
import { mapApiSupplierRow, mapSupplierFormToApi } from '@/lib/services/entity-api-mappers';
import { updateSupplier } from '@/lib/services/purchases-service';
import { useApiAppState } from '@/hooks/use-api-app-state';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import {
  getSupplierDetailProfile,
  type EnrichedSupplier,
  type SupplierDetailProfile,
} from '@/lib/services/suppliers-service';
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

function buildApiSupplierProfile(row: Record<string, unknown>): SupplierDetailProfile {
  const supplier = row as unknown as EnrichedSupplier;
  const payable = Number(row.payable ?? row.due ?? 0);
  const creditLimit = Number(row.creditLimit ?? 0);
  return {
    supplier,
    categoryLabel: `${supplier.category} Supplier`,
    location: String(row.location ?? row.address ?? '—'),
    metrics: {
      totalPurchase: 0,
      purchaseCount: 0,
      itemCount: 0,
      totalPaid: 0,
      paymentCount: 0,
      currentPayable: payable,
      billCount: 0,
      overdueAmount: 0,
      overdueBillCount: 0,
    },
    performance: {
      rating: Number(row.rating ?? 0),
      onTimeDelivery: 0,
      qualityAcceptance: 0,
      returnRate: 0,
      avgLeadTime: String(row.leadTime ?? row.lead ?? '—'),
      totalOrders: 0,
      completedOrders: 0,
      activeItems: 0,
    },
    creditLimit,
    openingBalance: Number(row.balance ?? 0),
    usedCredit: payable,
    usedCreditPct: creditLimit > 0 ? Math.round((payable / creditLimit) * 1000) / 10 : 0,
    nextDueAmount: payable,
    nextDueDate: String(row.dueDate ?? '—'),
    lastPaymentDate: '—',
    bills: [],
    activities: [],
  };
}

export function SupplierDetailPage({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('suppliers');
  const [apiSupplier, setApiSupplier] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(apiMode && Boolean(supplierId));
  const [, bump] = useState(0);
  const [activeTab, setActiveTab] = useState<SupplierDetailTabId>('overview');

  const apiRelated = useApiAppState(
    apiMode ? ['purchaseOrders', 'vendorBills', 'purchasePayments'] : undefined,
  );
  const dataState = apiMode ? apiRelated.state : appState;

  useEffect(() => {
    if (!apiMode || !supplierId) return;
    setApiLoading(true);
    void fetchResourceById(API_RESOURCE_PATHS.suppliers, supplierId).then((doc) => {
      setApiSupplier(doc ? mapApiSupplierRow(doc) : null);
      setApiLoading(false);
    });
  }, [apiMode, supplierId]);

  useChromeSuppressed(true);

  const profile = useMemo(() => {
    if (apiMode) {
      const enriched = supplierId ? getSupplierDetailProfile(dataState, supplierId) : null;
      if (enriched) return enriched;
      if (!apiSupplier) return null;
      return buildApiSupplierProfile(apiSupplier);
    }
    return supplierId ? getSupplierDetailProfile(appState, supplierId) : null;
  }, [apiMode, apiSupplier, dataState, appState, supplierId, bump]);

  const handleDeactivate = async () => {
    if (!profile) return;
    if (apiMode) {
      const body = mapSupplierFormToApi({
        name: String(profile.supplier.name),
        contact: String(profile.supplier.contactName ?? ''),
        phone: String(profile.supplier.phone ?? ''),
        email: String(profile.supplier.email ?? ''),
        category: String(profile.supplier.category ?? 'General'),
        paymentTerms: String(profile.supplier.paymentTerms ?? 'Net 30'),
        address: String(profile.supplier.address ?? ''),
        status: 'inactive',
        notes: String(profile.supplier.notes ?? ''),
        lead: String(profile.supplier.leadTime ?? ''),
        rating: String(profile.supplier.rating ?? ''),
        imageUrl: String(profile.supplier.imageUrl ?? ''),
        imagePublicId: String(profile.supplier.imagePublicId ?? ''),
      });
      const result = await updateResource(API_RESOURCE_PATHS.suppliers, supplierId, body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Suppliers', description: 'error' in result ? String(result.error) : 'Update failed' });
        return;
      }
      const doc = await fetchResourceById(API_RESOURCE_PATHS.suppliers, supplierId);
      setApiSupplier(doc ? mapApiSupplierRow(doc) : null);
      toast.success('Supplier deactivated', {
        module: 'Suppliers',
        description: `${profile.supplier.name} marked as inactive.`,
      });
      return;
    }
    updateSupplier(appState, profile.supplier.id, { status: 'inactive' });
    saveAppState();
    bump((n) => n + 1);
    toast.success('Supplier deactivated', {
      module: 'Suppliers',
      description: `${profile.supplier.name} marked as inactive.`,
    });
  };

  if (apiLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading supplier…</div>;
  }

  if (!profile) {
    return (
      <>
        {apiRelated.error ? <ApiModeBanner module="suppliers" error={apiRelated.error} /> : null}
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
