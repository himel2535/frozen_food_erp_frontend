'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
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
import { SUPPLIER_CARD_CLS } from './suppliers/suppliers-styles';
import { isModuleApiMode } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { mapApiSupplierRow, mapSupplierFormToApi } from '@/lib/services/entity-api-mappers';
import { attachBackgroundImageLater } from '@/lib/services/background-image-attach';
import { patchSupplierImageUrl } from '@/lib/services/suppliers-api-service';
import type { PendingImageUpload } from '@/components/shared/ImageUploadField';

const PAGE_SIZE = 8;

type PageView = 'main' | 'add-form' | 'edit-form';

export function SuppliersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('suppliers');
  const apiStore = usePaginatedApiResource('suppliers', mapApiSupplierRow, { pageSize: PAGE_SIZE });
  const bootLoading = isKpiBootLoading(apiMode, apiStore.initialized);
  const [, bump] = useState(0);

  const [view, setView] = useState<PageView>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('recent');
  const [category, setCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);

  const allSuppliers = useMemo(() => {
    const local = listEnrichedSuppliers(appState);
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local) as EnrichedSupplier[];
  }, [apiMode, apiStore.initialized, apiStore.rows, appState, bump]);
  const metrics = useMemo(() => {
    if (apiMode) {
      const activeCount = allSuppliers.filter((s) => s.recordStatus === 'active').length;
      const payableRows = allSuppliers.filter((s) => s.payable > 0);
      return {
        totalSuppliers: apiStore.meta.total,
        activeCount,
        inactiveCount: allSuppliers.length - activeCount,
        totalPayable: payableRows.reduce((s, r) => s + r.payable, 0),
        payableSupplierCount: payableRows.length,
        overdueAmount: 0,
        overdueSupplierCount: 0,
        dueThisWeek: 0,
        dueThisWeekSupplierCount: 0,
      };
    }
    return getSupplierListMetrics(appState);
  }, [apiMode, allSuppliers, appState, bump]);

  const filtered = useMemo(() => {
    if (apiMode) {
      let data = allSuppliers;
      if (tab !== 'all') data = data.filter((s) => s.recordStatus === tab);
      if (category !== 'all') data = data.filter((s) => String(s.category) === category);
      return data;
    }
    return filterEnrichedSuppliers(allSuppliers, { search: localSearch, tab, sort, category });
  }, [allSuppliers, localSearch, tab, sort, category, apiMode]);

  const openCreate = () => {
    setEditingId(null);
    setFormValues(EMPTY_SUPPLIER_FORM);
    setFormKey((k) => k + 1);
    setView('add-form');
  };

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? <ModuleToolbarActions onAdd={openCreate} addLabel="Add Supplier" /> : null,
    [view],
  );

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

  const handleDeactivate = async (supplier: EnrichedSupplier) => {
    if (apiMode) {
      await apiStore.update(String(supplier.id), { ...mapSupplierFormToApi(supplierToFormValues(supplier)), status: 'inactive' });
      toast.success('Supplier deactivated', { module: 'Suppliers', description: `${supplier.name} marked as inactive.` });
      return;
    }
    updateSupplier(appState, supplier.id, { status: 'inactive' });
    saveAppState();
    bump((n) => n + 1);
    toast.success('Supplier deactivated', { module: 'Suppliers', description: `${supplier.name} marked as inactive.` });
  };

  const handleSave = async (
    values: SupplierFormValues,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ): Promise<boolean> => {
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
      imageUrl: values.imageUrl.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (apiMode) {
      const body = mapSupplierFormToApi(values);
      const result = editingId
        ? await apiStore.update(editingId, body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Save failed', { module: 'Suppliers', description: 'error' in result ? result.error : 'API error' });
        return false;
      }
      if (!editingId && pendingImageUpload && result.ok && 'id' in result) {
        attachBackgroundImageLater({
          recordId: String(result.id),
          savedImageUrl: values.imageUrl,
          pending: pendingImageUpload,
          patchImage: patchSupplierImageUrl,
          onAttached: () => apiStore.reload({ silent: true }),
          moduleName: 'Supplier',
        });
      }
      toast.success(editingId ? 'Supplier updated' : 'Supplier added', { module: 'Suppliers', description: `${values.name} saved.` });
      setView('main');
      setEditingId(null);
      setFormValues(EMPTY_SUPPLIER_FORM);
      return true;
    }

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
    return true;
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
    <>
      {apiMode ? <ApiModeBanner module="suppliers" error={apiStore.error} /> : null}

      <SuppliersMetrics metrics={metrics} loading={bootLoading} />

      <div className={SUPPLIER_CARD_CLS}>
        <SuppliersFilterBar
          search={apiMode ? apiStore.search : localSearch}
          tab={tab}
          sort={sort}
          category={category}
          onSearchChange={(v) => {
            if (apiMode) apiStore.setSearchTerm(v);
            else setLocalSearch(v);
            apiStore.setPage(1);
          }}
          onTabChange={(v) => { setTab(v); apiStore.setPage(1); }}
          onSortChange={(v) => { setSort(v); apiStore.setPage(1); }}
          onCategoryChange={(v) => { setCategory(v); apiStore.setPage(1); }}
        />
        <SuppliersTable
          rows={filtered as EnrichedSupplier[]}
          loading={bootLoading}
          page={apiStore.page}
          pageSize={PAGE_SIZE}
          total={apiMode ? apiStore.meta.total : filtered.length}
          serverPaginated={apiMode}
          onPageChange={apiStore.setPage}
          onView={(supplier) => router.push(`/purchases/suppliers/${supplier.id}`)}
          onEdit={openEdit}
          onDeactivate={handleDeactivate}
        />
      </div>

      <Footer />
    </>
  );
}
