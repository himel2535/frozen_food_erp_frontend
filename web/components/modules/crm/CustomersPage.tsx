'use client';

import { useMemo, useState } from 'react';
import { Download, Upload, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { KpiCards } from '@/components/shared/KpiCards';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import {
  CustomerForm,
  EMPTY_CUSTOMER_FORM,
  normalizePaymentTerms,
  type CustomerFormPayload,
  type CustomerFormValues,
} from '@/components/modules/crm/CustomerForm';
import type { CustomerSaveAction } from '@/components/modules/crm/customer-form/CustomerFormFooter';
import { useAppStore } from '@/lib/state/app-store';
import {
  getCustomerList,
  getCustomerProfile,
  getOwnerOptions,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  exportCustomersCsv,
} from '@/lib/services/crm-service';
import { formatMoney } from '@/lib/services/sales-service';

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

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'credit-hold', label: 'High-Risk' },
  { id: 'enterprise', label: 'Enterprise' },
];

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
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [sortKey, setSortKey] = useState('name-asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [formKey, setFormKey] = useState(0);

  const owners = useMemo(() => getOwnerOptions(appState), [appState]);

  const customers = useMemo(() => {
    let rows = getCustomerList(appState) as Array<Record<string, unknown>>;
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
      return String(a.name).localeCompare(String(b.name));
    });
    return rows;
  }, [appState, search, statusTab, sortKey]);

  const profile = useMemo(() => (drawerId ? getCustomerProfile(appState, drawerId) : null), [appState, drawerId]);

  const kpis = useMemo(() => {
    const all = getCustomerList(appState) as Array<Record<string, unknown>>;
    const active = all.filter((c) => c.status === 'active').length;
    const avg = all.length ? all.reduce((s, c) => s + Number(c.totalSales ?? 0), 0) / all.length : 0;
    const overdue = all.reduce((s, c) => s + Number(c.totalDue ?? 0), 0);
    const riskCount = all.filter((c) => Number(c.totalDue ?? 0) > 0).length;
    return [
      { key: 'active', label: 'Active Customers', value: String(all.length), sub: `${active} active accounts` },
      { key: 'reps', label: 'Total Reps', value: String(owners.length), sub: 'active owners' },
      { key: 'avg', label: 'Average Spending', value: formatMoney(avg), sub: 'per customer' },
      { key: 'due', label: 'Overdue / Credit Risk', value: formatMoney(overdue), sub: `${riskCount} customers on alert`, alert: riskCount > 0 },
    ];
  }, [appState, owners.length]);

  const resetForm = () => {
    setFormValues(buildEmptyFormValues(owners[0]?.id ?? ''));
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    const id = String(row.id);
    const customerProfile = getCustomerProfile(appState, id);
    setEditingId(id);
    if (customerProfile) {
      setFormValues(buildFormValuesFromProfile(customerProfile, owners[0]?.id ?? ''));
    } else {
      setFormValues({
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
    }
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleSave = (payload: CustomerFormPayload, action: CustomerSaveAction) => {
    const result = editingId
      ? updateCustomer(appState, editingId, payload)
      : createCustomer(appState, payload);
    if (!result.ok) {
      window.alert('error' in result && result.error ? String(result.error) : 'Duplicate or invalid customer');
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
    const csv = exportCustomersCsv(appState);
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
      label: 'Customer / Company',
      render: (row) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarClass(String(row.name))}`}>
            {initials(String(row.name))}
          </div>
          <div>
            <div className="font-bold text-slate-900">{String(row.name)}</div>
            <div className="text-slate-500">{String(row.company)}</div>
            <span className="inline-flex mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-slate-50 text-slate-600 border-slate-200">{String(row.category ?? 'Standard')}</span>
          </div>
        </div>
      ),
    },
    { key: 'contact', label: 'Primary Contact', render: (row) => <span className="font-medium">{String(row.name)}</span> },
    {
      key: 'contactInfo',
      label: 'Contact Info',
      render: (row) => (
        <>
          <div className="font-medium">{String(row.phone ?? '—')}</div>
          <div className="text-slate-400">{String(row.email ?? '')}</div>
        </>
      ),
    },
    {
      key: 'rep',
      label: 'Assigned Rep',
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
      label: 'Spend / Balance',
      render: (row) => (
        <>
          <div>Sales: <span className="font-bold">{formatMoney(Number(row.totalSales ?? 0))}</span></div>
          <div>Due: <span className="font-bold text-rose-600">{formatMoney(Number(row.totalDue ?? 0))}</span></div>
        </>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ], [selected]);

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
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Customers</h2>
          <p className="text-xs text-slate-500 mt-1">Customer master records, commercial terms, profile drawers, and activity logs.</p>
        </div>
        <button type="button" onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer self-start">
          + Add Customer
        </button>
      </div>

      <KpiCards items={kpis} />

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow space-y-4">
        <FilterTabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, company, phone..."
            className="flex-1 max-w-md px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"><Download className="w-4 h-4" /> Export CSV</button>
            <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"><Upload className="w-4 h-4" /> Import CSV</button>
            <button type="button" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"><Printer className="w-4 h-4" /> Print</button>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
              <option value="sales-desc">Sort: Sales high-low</option>
            </select>
          </div>
        </div>
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} actions={
          <button type="button" className="text-blue-700 font-bold cursor-pointer" onClick={handleExport}>Export selected</button>
        } />
      </div>

      <AppTable
        className="min-w-[900px]"
        columns={customerColumns}
        rows={customers}
        emptyMessage="No customers found."
        renderActions={(row) => (
          <>
            <TableIconAction
              variant="view"
              onClick={() => {
                setDrawerId(String(row.id));
                setDrawerTab('overview');
              }}
            />
            <TableIconAction variant="edit" onClick={() => openEdit(row)} />
            <TableIconAction
              variant="delete"
              onClick={() => {
                if (window.confirm('Delete customer?')) {
                  deleteCustomer(appState, String(row.id));
                  saveAppState();
                }
              }}
            />
          </>
        )}
      />

      <ProfileDrawer
        open={!!drawerId && !!profile}
        title={String(profile?.customer?.name ?? 'Customer')}
        subtitle={String(profile?.customer?.company ?? '')}
        onClose={() => setDrawerId(null)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'contacts', label: 'Contacts' },
          { id: 'sales', label: 'Sales' },
          { id: 'activity', label: 'Activity' },
        ]}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
      >
        {profile && drawerTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Status</span><div className="mt-1"><StatusBadge status={String(profile.customer.status)} /></div></div>
              <div><span className="text-slate-500">Payment terms</span><div className="mt-1 font-bold">{String(profile.customer.paymentTerms)}</div></div>
              <div><span className="text-slate-500">Total sales</span><div className="mt-1 font-bold">{formatMoney(Number(profile.financialSummary?.totalSales ?? 0))}</div></div>
              <div><span className="text-slate-500">Total due</span><div className="mt-1 font-bold text-rose-600">{formatMoney(Number(profile.financialSummary?.totalDue ?? 0))}</div></div>
            </div>
            <p className="text-slate-600">{String(profile.customer.notes || 'No notes.')}</p>
          </div>
        )}
        {profile && drawerTab === 'contacts' && (
          <ul className="space-y-3 text-xs">{(profile.contacts as Array<Record<string, unknown>>).map((c) => (
            <li key={String(c.id)} className="p-3 rounded-xl border border-slate-100">
              <div className="font-bold">{String(c.name)}</div>
              <div className="text-slate-500">{String(c.phone)} • {String(c.email)}</div>
            </li>
          ))}</ul>
        )}
        {profile && drawerTab === 'sales' && (
          <div className="space-y-3 text-xs">
            <div className="font-bold">Invoices ({profile.invoices?.length ?? 0})</div>
            {(profile.invoices as Array<Record<string, unknown>> ?? []).slice(0, 5).map((inv) => (
              <div key={String(inv.id)} className="flex justify-between border-b border-slate-100 py-2">
                <span>{String(inv.id)}</span>
                <span className="font-bold">{formatMoney(Number(inv.amount ?? 0))}</span>
              </div>
            ))}
          </div>
        )}
        {profile && drawerTab === 'activity' && (
          <ul className="space-y-2 text-xs">{((profile.activities ?? []) as Array<Record<string, unknown>>).slice(0, 8).map((a) => (
            <li key={String(a.id)} className="text-slate-600"><span className="font-bold text-slate-800">{String(a.type)}</span> — {String(a.summary)}</li>
          ))}</ul>
        )}
      </ProfileDrawer>

      <Footer />
    </div>
  );
}
