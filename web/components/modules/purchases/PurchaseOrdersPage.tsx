'use client';



import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Plus } from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/shared/PageHeader';

import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';

import { useAppStore } from '@/lib/state/app-store';

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

import { PO_BTN_PRIMARY, PO_CARD_CLS } from './purchase-orders/purchase-orders-styles';



export function PurchaseOrdersPage() {

  const router = useRouter();

  const appState = useAppStore((s) => s.appState);

  const saveAppState = useAppStore((s) => s.saveAppState);

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [supplierFilter, setSupplierFilter] = useState('');

  const [paymentFilter, setPaymentFilter] = useState('');

  const [dateFrom, setDateFrom] = useState('');

  const [dateTo, setDateTo] = useState('');

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  const [bottomTab, setBottomTab] = useState('items');



  const allRows = useMemo(() => listPurchases(appState), [appState]);

  const suppliers = useMemo(

    () => listSuppliers(appState).map((s) => ({ id: String(s.id), name: String(s.name ?? s.id) })),

    [appState],

  );



  const rows = useMemo(() => {

    let data = allRows;

    if (search) {

      const q = search.toLowerCase();

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

  }, [allRows, search, statusFilter, supplierFilter, paymentFilter, dateFrom, dateTo]);



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



  return (

    <div className={MODULE_LIST_SHELL}>

      <PageHeader
        title="Purchase Orders"
        subtitle="Create and track purchase orders with supplier workflows."
        size="compact"
        actions={
          <button
            type="button"
            onClick={() => router.push('/purchases/orders/new')}
            className={`${PO_BTN_PRIMARY} self-start`}
          >
            <Plus className="w-4 h-4" />
            Create PO
          </button>
        }
      />



      <PurchaseOrdersMetrics metrics={metrics} />



      <div className={PO_CARD_CLS}>

        <PurchaseOrdersFilterBar

          search={search}

          statusFilter={statusFilter}

          supplierFilter={supplierFilter}

          paymentFilter={paymentFilter}

          dateFrom={dateFrom}

          dateTo={dateTo}

          suppliers={suppliers}

          onSearchChange={setSearch}

          onStatusChange={setStatusFilter}

          onSupplierChange={setSupplierFilter}

          onPaymentChange={setPaymentFilter}

          onDateFromChange={setDateFrom}

          onDateToChange={setDateTo}

        />

      </div>



      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-stretch">

        <PurchaseOrdersTable

          rows={rows}

          selectedPoId={selectedPoId}

          appState={appState}

          onSelect={setSelectedPoId}

          onSave={save}

        />

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

    </div>

  );

}

