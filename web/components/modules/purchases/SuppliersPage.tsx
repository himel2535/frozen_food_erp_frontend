'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { createSupplier, updateSupplier } from '@/lib/services/purchases-service';
import {
  filterEnrichedSuppliers,
  getSupplierListMetrics,
  listEnrichedSuppliers,
  type EnrichedSupplier,
} from '@/lib/services/suppliers-service';
import { SuppliersMetrics } from './suppliers/SuppliersMetrics';
import { SuppliersFilterBar } from './suppliers/SuppliersFilterBar';
import { SuppliersTable } from './suppliers/SuppliersTable';
import {
  EMPTY_SUPPLIER_FORM,
  SupplierForm,
  supplierToFormValues,
  type SupplierFormValues,
} from './suppliers/SupplierForm';
import { SUPPLIER_BTN_PRIMARY, SUPPLIER_CARD_CLS } from './suppliers/suppliers-styles';

const PAGE_SIZE = 8;

type PageView = 'main' | 'add-form' | 'edit-form';

export function SuppliersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [, bump] = useState(0);

  const [view, setView] = useState<PageView>('main');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('recent');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);

  const allSuppliers = useMemo(() => listEnrichedSuppliers(appState), [appState, bump]);
  const metrics = useMemo(() => getSupplierListMetrics(appState), [appState, bump]);

  const filtered = useMemo(
    () => filterEnrichedSuppliers(allSuppliers, { search, tab, sort, category }),
    [allSuppliers, search, tab, sort, category],
  );

  const openCreate = () => {
    setEditingId(null);
    setFormValues(EMPTY_SUPPLIER_FORM);
    setFormKey((k) => k + 1);
    setView('add-form');
  };

  const openEdit = (supplier: EnrichedSupplier) => {
    setEditingId(supplier.id);
    setFormValues(supplierToFormValues(supplier));
    setFormKey((k) => k + 1);
    setView('edit-form');
  };

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const supplier = allSuppliers.find((s) => s.id === editId);
    if (supplier) openEdit(supplier);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allSuppliers]);

  const handleDeactivate = (supplier: EnrichedSupplier) => {
    updateSupplier(appState, supplier.id, { status: 'inactive' });
    saveAppState();
    bump((n) => n + 1);
    toast.success('Supplier deactivated', { module: 'Suppliers', description: `${supplier.name} marked as inactive.` });
  };

  const handleSave = (values: SupplierFormValues) => {
    const payload = {
      name: values.name.trim(),
      contact: values.contact.trim(),
      phone: values.phone.trim(),
      category: values.category,
      paymentTerms: values.paymentTerms,
      terms: values.paymentTerms,
      status: values.status,
      email: values.email.trim() || undefined,
      lead: values.lead.trim() || undefined,
      address: values.address.trim() || undefined,
      notes: values.notes.trim() || undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (editingId) {
      updateSupplier(appState, editingId, payload);
      saveAppState();
      bump((n) => n + 1);
      toast.success('Supplier updated', { module: 'Suppliers', description: `${values.name} saved successfully.` });
    } else {
      createSupplier(appState, payload);
      saveAppState();
      bump((n) => n + 1);
      toast.success('Supplier added', { module: 'Suppliers', description: `${values.name} added to your supplier list.` });
    }

    setView('main');
    setEditingId(null);
    setFormValues(EMPTY_SUPPLIER_FORM);
  };

  if (view === 'add-form' || view === 'edit-form') {
    return (
      <SupplierForm
        key={formKey}
        mode={view === 'add-form' ? 'create' : 'edit'}
        initialValues={formValues}
        onCancel={() => {
          setView('main');
          setEditingId(null);
        }}
        onSave={handleSave}
      />
    );
  }

  return (
    <div className={MODULE_LIST_SHELL}>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier relationships, purchases and payments."
        size="compact"
        actions={
          <button type="button" onClick={openCreate} className={`${SUPPLIER_BTN_PRIMARY} self-start`}>
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        }
      />

      <SuppliersMetrics metrics={metrics} />

      <div className={SUPPLIER_CARD_CLS}>
        <SuppliersFilterBar
          search={search}
          tab={tab}
          sort={sort}
          category={category}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onTabChange={(v) => { setTab(v); setPage(1); }}
          onSortChange={(v) => { setSort(v); setPage(1); }}
          onCategoryChange={(v) => { setCategory(v); setPage(1); }}
        />
        <SuppliersTable
          rows={filtered}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onView={(supplier) => router.push(`/purchases/suppliers/${supplier.id}`)}
          onEdit={openEdit}
          onDeactivate={handleDeactivate}
        />
      </div>

      <Footer />
    </div>
  );
}
