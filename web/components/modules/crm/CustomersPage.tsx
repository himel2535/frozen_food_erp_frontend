'use client';

import { useMemo, useState } from 'react';
import { Eye, Pencil, Trash2, Download, Upload, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { KpiCards } from '@/components/shared/KpiCards';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ProfileDrawer } from '@/components/shared/ProfileDrawer';
import { BulkActionBar } from '@/components/shared/BulkActionBar';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', status: 'active', category: 'Standard',
    companyType: 'Distributor', creditLimit: '0', paymentTerms: 'Net 30', ownerId: '',
    billingAddress: '', billingCity: '', shippingAddress: '', shippingCity: '', notes: '',
  });

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
    setForm({
      name: '', company: '', phone: '', email: '', status: 'active', category: 'Standard',
      companyType: 'Distributor', creditLimit: '0', paymentTerms: 'Net 30', ownerId: owners[0]?.id ?? '',
      billingAddress: '', billingCity: '', shippingAddress: '', shippingCity: '', notes: '',
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setForm({
      name: String(row.name ?? ''), company: String(row.company ?? ''), phone: String(row.phone ?? ''),
      email: String(row.email ?? ''), status: String(row.status ?? 'active'), category: String(row.category ?? 'Standard'),
      companyType: String(row.companyType ?? 'Distributor'), creditLimit: String(row.creditLimit ?? '0'),
      paymentTerms: String(row.paymentTerms ?? 'Net 30'), ownerId: String(row.ownerId ?? owners[0]?.id ?? ''),
      billingAddress: '', billingCity: '', shippingAddress: '', shippingCity: '', notes: String(row.notes ?? ''),
    });
    setView('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const owner = owners.find((o: { id: string; name: string }) => o.id === form.ownerId) || owners[0];
    const payload = { ...form, ownerName: owner?.name, contactName: form.name };
    const result = editingId
      ? updateCustomer(appState, editingId, payload)
      : createCustomer(appState, payload);
    if (!result.ok) {
      window.alert('error' in result && result.error ? String(result.error) : 'Duplicate or invalid customer');
      return;
    }
    saveAppState();
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

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <FormHeader title={editingId ? 'Edit Customer' : 'Add Customer'} subtitle="Customer master records, commercial terms, and profile." onBack={() => { setView('main'); resetForm(); }} />
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div><label className="block mb-2">Name <span className="text-rose-500">*</span></label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block mb-2">Company <span className="text-rose-500">*</span></label><input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block mb-2">Phone <span className="text-rose-500">*</span></label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block mb-2">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block mb-2">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">{['active', 'inactive', 'overdue', 'credit-hold'].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="block mb-2">Assigned rep</label><select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">{owners.map((o: { id: string; name: string }) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
            </div>
            <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 pt-4 border-t border-slate-100">
                <div><label className="block mb-2">Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Credit limit</label><input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Payment terms</label><input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block mb-2">Billing city</label><input value={form.billingCity} onChange={(e) => setForm({ ...form, billingCity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div className="md:col-span-2"><label className="block mb-2">Notes</label><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50" /></div>
              </div>
            )}
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer">Save Customer</button>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Customers</h2>
          <p className="text-xs text-slate-500 mt-1">Customer master records, commercial terms, profile drawers, and activity logs.</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setView('form'); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer self-start">
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

      <div className="bg-white rounded-xl border border-slate-200/80 premium-shadow overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-4 py-3 w-10"><input type="checkbox" className="cursor-pointer" onChange={(e) => setSelected(e.target.checked ? new Set(customers.map((c) => String(c.id))) : new Set())} /></th>
              <th className="px-4 py-3">Customer / Company</th>
              <th className="px-4 py-3">Primary Contact</th>
              <th className="px-4 py-3">Contact Info</th>
              <th className="px-4 py-3">Assigned Rep</th>
              <th className="px-4 py-3">Spend / Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((row) => (
              <tr key={String(row.id)} className="hover:bg-slate-50/80">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(String(row.id))} onChange={() => toggleSelect(String(row.id))} className="cursor-pointer" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarClass(String(row.name))}`}>{initials(String(row.name))}</div>
                    <div>
                      <div className="font-bold text-slate-900">{String(row.name)}</div>
                      <div className="text-slate-500">{String(row.company)}</div>
                      <span className="inline-flex mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border bg-slate-50 text-slate-600 border-slate-200">{String(row.category ?? 'Standard')}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{String(row.name)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{String(row.phone ?? '—')}</div>
                  <div className="text-slate-400">{String(row.email ?? '')}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 font-bold text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[9px] flex items-center justify-center">{initials(String(row.ownerName ?? row.salesRepName ?? 'R'))}</span>
                    {String(row.ownerName ?? row.salesRepName ?? '—')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>Sales: <span className="font-bold">{formatMoney(Number(row.totalSales ?? 0))}</span></div>
                  <div>Due: <span className="font-bold text-rose-600">{formatMoney(Number(row.totalDue ?? 0))}</span></div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={String(row.status)} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setDrawerId(String(row.id)); setDrawerTab('overview'); }} className="inline-flex items-center gap-1 text-blue-600 font-bold cursor-pointer"><Eye className="w-4 h-4" /> View</button>
                    <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1 text-amber-600 font-bold cursor-pointer"><Pencil className="w-4 h-4" /> Edit</button>
                    <button type="button" onClick={() => { if (window.confirm('Delete customer?')) { deleteCustomer(appState, String(row.id)); saveAppState(); } }} className="text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
