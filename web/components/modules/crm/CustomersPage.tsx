'use client';

import { confirmAction, toast } from '@/lib/ui/feedback';

import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Upload, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_INPUT, MODULE_PRINT_BTN, MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { ModuleRouteSkeleton } from '@/components/shared/ModuleListSkeleton';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import type { PendingImageUpload } from '@/components/shared/ImageUploadField';
import {
  CustomerForm,
  EMPTY_CUSTOMER_FORM,
  normalizePaymentTerms,
  type CustomerFormPayload,
  type CustomerFormValues,
} from '@/components/modules/crm/CustomerForm';
import type { CustomerSaveAction } from '@/components/modules/crm/customer-form/CustomerFormFooter';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import {
  getCustomerList,
  getCustomerProfile,
  getOwnerOptions,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  exportCustomersCsv,
} from '@/lib/services/crm-service';
import { isModuleApiMode } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { useCustomersApiStore } from '@/hooks/use-customers-module';
import { attachBackgroundImageLater } from '@/lib/services/background-image-attach';
import {
  exportCustomersCsvFromRows,
  fetchCustomerFromApi,
  mapApiCustomerToFormValues,
  patchCustomerImageUrl,
} from '@/lib/services/customers-api-service';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function initials(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarClass(name: string) {
  const code = String(name).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function buildEmptyFormValues(ownerId: string): CustomerFormValues {
  return { ...EMPTY_CUSTOMER_FORM, ownerId };
}

function buildFormValuesFromProfile(
  profile: NonNullable<ReturnType<typeof getCustomerProfile>>,
  ownerIdFallback: string,
): CustomerFormValues {
  const customer = profile.customer as Record<string, unknown>;
  const contacts = (profile.contacts ?? []) as Array<Record<string, unknown>>;
  const addresses = (profile.addresses ?? []) as Array<Record<string, unknown>>;
  const primary = contacts.find((c) => c.primary) ?? contacts[0];
  const billing = addresses.find((a) => a.type === 'billing') ?? addresses[0];
  const shipping = addresses.find((a) => a.type === 'shipping') ?? addresses[1];

  const billingAddress = String(billing?.line1 ?? '');
  const billingArea = String(billing?.area ?? '');
  const billingCity = String(billing?.city ?? '');
  const billingDistrict = String(billing?.region ?? '');
  const shippingAddress = String(shipping?.line1 ?? '');
  const shippingArea = String(shipping?.area ?? '');
  const shippingCity = String(shipping?.city ?? '');
  const shippingDistrict = String(shipping?.region ?? '');

  const sameAsBilling =
    billingAddress === shippingAddress &&
    billingArea === shippingArea &&
    billingCity === shippingCity &&
    billingDistrict === shippingDistrict;

  return {
    companyName: String(customer.company ?? ''),
    customerType: String(customer.companyType ?? ''),
    contactPerson: String(primary?.name ?? customer.name ?? ''),
    altPhone: String(primary?.alternativePhone ?? ''),
    mobile: String(primary?.phone ?? ''),
    status: String(customer.status ?? 'active'),
    email: String(primary?.email ?? ''),
    imageUrl: String(customer.imageUrl ?? ''),
    imagePublicId: String(customer.imagePublicId ?? ''),
    billingAddress,
    billingArea,
    billingCity,
    billingDistrict,
    shippingAddress,
    shippingArea,
    shippingCity,
    shippingDistrict,
    sameAsBilling,
    binVat: String(customer.taxVatNumber ?? ''),
    tin: String(customer.tinNumber ?? ''),
    tradeLicense: String(customer.tradeLicenseNumber ?? ''),
    businessReg: String(customer.businessRegistrationNo ?? ''),
    openingBalance: String(customer.openingBalance ?? '0'),
    creditLimit: String(customer.creditLimit ?? '0'),
    paymentTerms: normalizePaymentTerms(String(customer.paymentTerms ?? '')),
    priceLevel: String(customer.pricingTier ?? 'Standard'),
    ownerId: String(customer.ownerId ?? ownerIdFallback),
    notes: String(customer.notes ?? ''),
  };
}

export function CustomersPage() {
  return (
    <Suspense fallback={<ModuleRouteSkeleton />}>
      <CustomersPageContent />
    </Suspense>
  );
}

function CustomersPageContent() {
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCount } = useLocaleFormat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('customers');
  const apiStore = useCustomersApiStore();
  const bootLoading = isKpiBootLoading(apiMode, apiStore.initialized);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [sortKey, setSortKey] = useState('newest-first');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [formKey, setFormKey] = useState(0);

  const owners = useMemo(() => getOwnerOptions(appState), [appState]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;

    const openFromProfile = (profile: NonNullable<ReturnType<typeof getCustomerProfile>> | null, apiDoc?: Awaited<ReturnType<typeof fetchCustomerFromApi>>) => {
      setEditingId(editId);
      if (apiDoc) {
        setFormValues(mapApiCustomerToFormValues(apiDoc, owners[0]?.id ?? ''));
      } else if (profile) {
        setFormValues(buildFormValuesFromProfile(profile, owners[0]?.id ?? ''));
      }
      setFormKey((k) => k + 1);
      setView('form');
      router.replace('/crm/customers');
    };

    if (apiMode) {
      void fetchCustomerFromApi(editId).then((doc) => {
        if (doc) openFromProfile(null, doc);
      });
      return;
    }

    const customerProfile = getCustomerProfile(appState, editId);
    if (customerProfile) openFromProfile(customerProfile);
    else router.replace('/crm/customers');
  }, [searchParams, appState, owners, router, apiMode]);

  const sourceCustomers = useMemo(() => {
    const local = getCustomerList(appState) as Array<Record<string, unknown>>;
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);

  const customers = useMemo(() => {
    let rows = [...sourceCustomers];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => [c.name, c.company, c.phone, c.email].some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    if (statusTab === 'enterprise') {
      rows = rows.filter((c) => String(c.category ?? '').toLowerCase().includes('enterprise') || String(c.pricingTier ?? '').toLowerCase().includes('enterprise'));
    } else if (statusTab !== 'all') {
      rows = rows.filter((c) => String(c.status ?? '').toLowerCase() === statusTab);
    }
    rows.sort((a, b) => {
      if (sortKey === 'name-desc') return String(b.name).localeCompare(String(a.name));
      if (sortKey === 'sales-desc') return Number(b.totalSales ?? 0) - Number(a.totalSales ?? 0);
      if (sortKey === 'name-asc') return String(a.name).localeCompare(String(b.name));
      const aTime = Date.parse(String(a.createdAt ?? a.lastActivityDate ?? '')) || 0;
      const bTime = Date.parse(String(b.createdAt ?? b.lastActivityDate ?? '')) || 0;
      if (bTime !== aTime) return bTime - aTime;
      return String(b.id ?? '').localeCompare(String(a.id ?? ''));
    });
    return rows;
  }, [sourceCustomers, search, statusTab, sortKey]);

  const statusTabs = useMemo(() => [
    { id: 'all', label: t('common.all') },
    { id: 'active', label: t('common.active') },
    { id: 'overdue', label: t('crm.filter_overdue_tab') },
    { id: 'credit-hold', label: t('crm.filter_high_risk') },
    { id: 'enterprise', label: t('crm.filter_enterprise') },
  ], [t]);

  const kpis = useMemo(() => {
    const all = sourceCustomers;
    const active = all.filter((c) => c.status === 'active').length;
    const avg = all.length ? all.reduce((s, c) => s + Number(c.totalSales ?? 0), 0) / all.length : 0;
    const overdue = all.reduce((s, c) => s + Number(c.totalDue ?? 0), 0);
    const riskCount = all.filter((c) => Number(c.totalDue ?? 0) > 0).length;
    return [
      { key: 'active', label: t('crm.kpi_total_customers'), value: formatCount(all.length), sub: `${formatCount(active)} ${t('crm.kpi_active_customers').toLowerCase()}` },
      { key: 'reps', label: t('crm.kpi_total_sales'), value: formatCount(owners.length) },
      { key: 'avg', label: t('crm.kpi_total_sales'), value: formatMoney(avg) },
      { key: 'due', label: t('crm.kpi_overdue_balance'), value: formatMoney(overdue), sub: formatCount(riskCount), alert: riskCount > 0 },
    ];
  }, [sourceCustomers, owners.length, t, formatMoney, formatCount]);

  const resetForm = () => {
    setFormValues(buildEmptyFormValues(owners[0]?.id ?? ''));
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = useCallback(() => {
    resetForm();
    setView('form');
  }, []);

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? (
      <ModuleToolbarActions onAdd={openCreate} addLabel={t('crm.add_customer')} />
    ) : null,
    [view, openCreate, t],
  );

  const openEdit = (row: Record<string, unknown>) => {
    const id = String(row.id);
    setEditingId(id);

    const openWithForm = (values: CustomerFormValues) => {
      setFormValues(values);
      setFormKey((k) => k + 1);
      setView('form');
    };

    if (apiMode) {
      void fetchCustomerFromApi(id).then((doc) => {
        if (doc) {
          openWithForm(mapApiCustomerToFormValues(doc, owners[0]?.id ?? ''));
          return;
        }
        openWithForm({
          ...buildEmptyFormValues(String(row.ownerId ?? owners[0]?.id ?? '')),
          companyName: String(row.company ?? ''),
          contactPerson: String(row.name ?? ''),
          customerType: String(row.companyType ?? ''),
          mobile: String(row.phone ?? ''),
          email: String(row.email ?? ''),
          status: String(row.status ?? 'active'),
          creditLimit: String(row.creditLimit ?? '0'),
          paymentTerms: normalizePaymentTerms(String(row.paymentTerms ?? '')),
          priceLevel: String(row.pricingTier ?? 'Standard'),
          notes: String(row.notes ?? ''),
        });
      });
      return;
    }

    const customerProfile = getCustomerProfile(appState, id);
    if (customerProfile) {
      openWithForm(buildFormValuesFromProfile(customerProfile, owners[0]?.id ?? ''));
      return;
    }
    openWithForm({
      ...buildEmptyFormValues(String(row.ownerId ?? owners[0]?.id ?? '')),
      companyName: String(row.company ?? ''),
      contactPerson: String(row.name ?? ''),
      customerType: String(row.companyType ?? ''),
      mobile: String(row.phone ?? ''),
      email: String(row.email ?? ''),
      status: String(row.status ?? 'active'),
      creditLimit: String(row.creditLimit ?? '0'),
      paymentTerms: normalizePaymentTerms(String(row.paymentTerms ?? '')),
      priceLevel: String(row.pricingTier ?? 'Standard'),
      notes: String(row.notes ?? ''),
    });
  };

  const handleSave = async (
    payload: CustomerFormPayload,
    action: CustomerSaveAction,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => {
    if (apiMode) {
      const result = editingId
        ? await apiStore.update(editingId, payload)
        : await apiStore.create(payload);
      if (!result.ok) {
        toast.error('Could not save customer', {
          module: 'Customers',
          description: 'error' in result && result.error ? String(result.error) : 'API save failed',
        });
        return;
      }
      const customerId = editingId
        || (result.ok && 'id' in result && typeof result.id === 'string' ? result.id : '');
      if (customerId && pendingImageUpload) {
        attachBackgroundImageLater({
          recordId: customerId,
          savedImageUrl: payload.imageUrl,
          pending: pendingImageUpload,
          patchImage: patchCustomerImageUrl,
          onAttached: () => apiStore.reload({ silent: true }),
          moduleName: 'Customers',
        });
      }
      if (action === 'save-and-add') {
        setEditingId(null);
        setFormValues(buildEmptyFormValues(owners[0]?.id ?? ''));
        setFormKey((k) => k + 1);
        return;
      }
      setView('main');
      resetForm();
      return;
    }

    const result = editingId
      ? updateCustomer(appState, editingId, payload)
      : createCustomer(appState, payload);
    if (!result.ok) {
      toast.error('Could not save customer', {
        module: 'Customers',
        description: 'error' in result && result.error ? String(result.error) : 'Duplicate or invalid customer',
      });
      return;
    }
    saveAppState();
    if (action === 'save-and-add') {
      setEditingId(null);
      setFormValues(buildEmptyFormValues(owners[0]?.id ?? ''));
      setFormKey((k) => k + 1);
      return;
    }
    setView('main');
    resetForm();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const csv = apiMode ? exportCustomersCsvFromRows(sourceCustomers) : exportCustomersCsv(appState);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const customerColumns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: '_select',
      label: '',
      headerClassName: 'w-10',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(String(row.id))}
          onChange={() => toggleSelect(String(row.id))}
          className="cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'name',
      label: t('crm.customers_title'),
      render: (row) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <InventoryItemThumb
            imageUrl={String(row.imageUrl ?? '')}
            alt={String(row.name ?? '')}
            className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0"
            fallback={
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarClass(String(row.name))}`}>
                {initials(String(row.name))}
              </div>
            }
          />
          <div>
            <div className="font-bold text-slate-900">{String(row.name)}</div>
            <div className="text-slate-500">{String(row.company)}</div>
            <span className="inline-flex mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-slate-50 text-slate-600 border-slate-200">{String(row.category ?? 'Standard')}</span>
          </div>
        </div>
      ),
    },
    { key: 'contact', label: t('crm.form_contact_person'), render: (row) => <span className="font-medium">{String(row.name)}</span> },
    {
      key: 'contactInfo',
      label: t('crm.col_contact'),
      render: (row) => (
        <>
          <div className="font-medium">{String(row.phone ?? '—')}</div>
          <div className="text-slate-400">{String(row.email ?? '')}</div>
        </>
      ),
    },
    {
      key: 'rep',
      label: t('crm.col_assigned_to'),
      render: (row) => (
        <span className="inline-flex items-center gap-2 font-bold text-slate-700">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[9px] flex items-center justify-center">
            {initials(String(row.ownerName ?? row.salesRepName ?? 'R'))}
          </span>
          {String(row.ownerName ?? row.salesRepName ?? '—')}
        </span>
      ),
    },
    {
      key: 'spend',
      label: t('crm.kpi_total_sales'),
      render: (row) => (
        <>
          <div>Sales: <span className="font-bold">{formatMoney(Number(row.totalSales ?? 0))}</span></div>
          <div>Due: <span className="font-bold text-rose-600">{formatMoney(Number(row.totalDue ?? 0))}</span></div>
        </>
      ),
    },
    { key: 'status', label: t('sales.col_status'), render: (row) => <StatusBadge status={String(row.status)} /> },
  ], [selected, t, formatMoney]);

  if (view === 'form') {
    return (
      <CustomerForm
        key={formKey}
        mode={editingId ? 'edit' : 'create'}
        initialValues={formValues}
        owners={owners}
        onCancel={() => { setView('main'); resetForm(); }}
        onSave={handleSave}
      />
    );
  }

  return (
    <>
      {apiMode ? <ApiModeBanner module="customers" error={apiStore.error} /> : null}

      <ModuleKpiSection items={kpis} loading={bootLoading} gridClassName={getKpiGridClassName(4)} kpiCount={4} />

      <ModuleFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('crm.search_customers')}
        filters={
          <>
            <FilterTabs tabs={statusTabs} active={statusTab} onChange={setStatusTab} />
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={MODULE_FILTER_INPUT}>
              <option value="newest-first">Sort: Newest first</option>
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
              <option value="sales-desc">Sort: Sales high-low</option>
            </select>
          </>
        }
        actions={
          <>
            <button type="button" onClick={handleExport} className={MODULE_SECONDARY_BTN}><Download className="w-4 h-4" /> Export CSV</button>
            <button type="button" className={MODULE_SECONDARY_BTN}><Upload className="w-4 h-4" /> Import CSV</button>
            <button type="button" className={MODULE_PRINT_BTN}><Printer className="w-4 h-4" /> Print</button>
          </>
        }
        footer={
          <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} actions={
            <button type="button" className="text-blue-700 font-bold cursor-pointer" onClick={handleExport}>Export selected</button>
          } />
        }
      />

      <AppTable
        className="min-w-[900px]"
        columns={customerColumns}
        rows={customers}
        loading={bootLoading}
        emptyMessage={apiStore.loading ? 'Loading customers…' : t('crm.no_customers')}
        renderActions={(row) => (
          <>
            <TableIconAction
              variant="view"
              onClick={() => router.push(`/crm/customers/${String(row.id)}`)}
            />
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            <TableIconAction
              variant="delete"
              onClick={() => {
                confirmAction({ title: 'Delete customer', message: 'Delete customer?', confirmLabel: 'Delete', tone: 'danger', module: 'Customers' }).then(async (__ok) => {
                  if (!__ok) return;
                  if (apiMode) {
                    const result = await apiStore.remove(String(row.id));
                    if (!result.ok) {
                      toast.error('Delete failed', { module: 'Customers', description: result.error });
                    }
                    return;
                  }
                  deleteCustomer(appState, String(row.id));
                  saveAppState();
                });
              }}
            />
          </>
        )}
      />

      <Footer />
    </>
  );
}
