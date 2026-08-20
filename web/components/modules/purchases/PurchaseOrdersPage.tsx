'use client';



import { useMemo, useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Plus } from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapGenericApiRow } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { mapApiSupplierRow } from '@/lib/services/entity-api-mappers';

import {

  getPurchaseOrderMetrics,

  listPurchases,

  listSuppliers,

} from '@/lib/services/purchases-service';

import { PurchaseOrdersMetrics } from './purchase-orders/PurchaseOrdersMetrics';

import { PurchaseOrdersFilterBar } from './purchase-orders/PurchaseOrdersFilterBar';

import { PurchaseOrdersTable } from './purchase-orders/PurchaseOrdersTable';

import { PurchaseOrdersDetailSidebar } from './purchase-orders/PurchaseOrdersDetailSidebar';

import { PurchaseOrdersDetailPanel } from './purchase-orders/PurchaseOrdersDetailPanel';

import { poFirstItemLabel } from './purchase-orders/purchase-orders-utils';

import { ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { PO_CARD_CLS } from './purchase-orders/purchase-orders-styles';



export function PurchaseOrdersPage() {

  const router = useRouter();
  const apiMode = isModuleApiMode('purchaseOrders');
  const apiStore = usePaginatedApiResource('purchaseOrders', mapGenericApiRow, { pageSize: 25 });
  const supplierStore = useApiResourceStore('suppliers', mapApiSupplierRow, { pageOnly: true, lookupLimit: 100 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);

  const appState = useAppStore((s) => s.appState);

  const saveAppState = useAppStore((s) => s.saveAppState);

  const [localSearch, setLocalSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [supplierFilter, setSupplierFilter] = useState('');

  const [paymentFilter, setPaymentFilter] = useState('');

  const [dateFrom, setDateFrom] = useState('');

  const [dateTo, setDateTo] = useState('');

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  const [bottomTab, setBottomTab] = useState('items');



  const allRows = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listPurchases(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );

  const suppliers = useMemo(
    () => (apiMode
      ? supplierStore.rows.map((s) => ({ id: String(s.id), name: String(s.name ?? s.id) }))
      : listSuppliers(appState).map((s) => ({ id: String(s.id), name: String(s.name ?? s.id) }))),
    [apiMode, supplierStore.rows, appState],
  );



  const rows = useMemo(() => {

    let data = allRows;

    const q = apiMode ? '' : localSearch.toLowerCase();

    if (q) {

      data = data.filter((row) => {

        const { primary } = poFirstItemLabel(row);

        return `${row.id} ${row.supplier} ${row.supplierName} ${row.reference} ${primary}`

          .toLowerCase()

          .includes(q);

      });

    }

    if (statusFilter !== 'all') {

      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);

    }

    if (supplierFilter) {

      data = data.filter((row) => String(row.supplierId) === supplierFilter);

    }

    if (paymentFilter) {

      data = data.filter((row) => String(row.paymentStatus ?? 'unpaid') === paymentFilter);

    }

    if (dateFrom) {

      data = data.filter((row) => String(row.date) >= dateFrom);

    }

    if (dateTo) {

      data = data.filter((row) => String(row.date) <= dateTo);

    }

    return data.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  }, [allRows, apiMode, apiStore.search, localSearch, statusFilter, supplierFilter, paymentFilter, dateFrom, dateTo]);



  useEffect(() => {

    if (!rows.length) {

      setSelectedPoId(null);

      return;

    }

    if (!selectedPoId || !rows.some((r) => String(r.id) === selectedPoId)) {

      setSelectedPoId(String(rows[0].id));

    }

  }, [rows, selectedPoId]);



  const metrics = useMemo(() => getPurchaseOrderMetrics(allRows), [allRows]);

  const selectedPo = rows.find((r) => String(r.id) === selectedPoId) ?? null;



  const save = () => saveAppState();

  useRegisterModuleActions(
    <ModuleToolbarActions onAdd={() => router.push('/purchases/orders/new')} addLabel="Create PO" />,
    [router],
  );

  return (
    <>
      {apiMode && <ApiModeBanner module="purchaseOrders" error={apiStore.error} />}
      <PurchaseOrdersMetrics metrics={metrics} loading={bootLoading} />



      <div className={PO_CARD_CLS}>

        <PurchaseOrdersFilterBar

          search={apiMode ? apiStore.search : localSearch}

          statusFilter={statusFilter}

          supplierFilter={supplierFilter}

          paymentFilter={paymentFilter}

          dateFrom={dateFrom}

          dateTo={dateTo}

          suppliers={suppliers}

          onSearchChange={(v) => {
            if (apiMode) apiStore.setSearchTerm(v);
            else setLocalSearch(v);
            if (apiMode) apiStore.setPage(1);
          }}

          onStatusChange={(v) => { setStatusFilter(v); if (apiMode) apiStore.setPage(1); }}

          onSupplierChange={setSupplierFilter}

          onPaymentChange={setPaymentFilter}

          onDateFromChange={setDateFrom}

          onDateToChange={setDateTo}

        />

      </div>



      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-stretch">

        <div className="min-w-0">
          <PurchaseOrdersTable

            rows={rows}

            loading={bootLoading}

            selectedPoId={selectedPoId}

            appState={appState}

            onSelect={setSelectedPoId}

            onSave={save}

          />

          {apiMode ? (
            <ListPagination
              page={apiStore.page}
              pageSize={apiStore.pageSize}
              total={apiStore.meta.total}
              onPageChange={apiStore.setPage}
            />
          ) : null}
        </div>

        {selectedPo && (

          <PurchaseOrdersDetailSidebar po={selectedPo} appState={appState} />

        )}

      </div>



      {selectedPo && (
        <PurchaseOrdersDetailPanel
          po={selectedPo}
          appState={appState}
          bottomTab={bottomTab}
          onTabChange={setBottomTab}
        />
      )}



      <Footer />
    </>
  );
}

