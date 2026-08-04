'use client';

import {
  listSuppliers, createSupplier, updateSupplier, deleteSupplier,
  listPurchases, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getPurchaseOrderMetrics, sendPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
  listGoodsReceived, listVendorBills, listPurchasePayments, listPurchaseReturns, listRecipes,
  createGoodsReceived,
} from '@/lib/services/purchases-service';
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '@/lib/services/recipes-service';
import { createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';
import { adapter, money, countStatus, countStatusIn, sumField, kpiCount, kpiMoneySum, React, toast, confirmAction, type DedicatedModuleConfig } from './shared';
const purchasesOrdersConfig: DedicatedModuleConfig = {
  id: 'purchases-orders',
  title: 'Purchase Orders',
  subtitle: 'Create and track purchase orders with supplier workflows.',
  addLabel: 'Create PO',
  searchKeys: ['id', 'supplier', 'product'],
  statusTabs: [{ id: 'all', label: 'All' }, { id: 'draft', label: 'Draft' }, { id: 'sent', label: 'Sent' }, { id: 'received', label: 'Received' }],
  columns: [
    { key: 'id', label: 'PO ID' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'product', label: 'Product' },
    { key: 'qty', label: 'Qty Ordered' },
    { key: 'unitCost', label: 'Unit Cost', render: (r) => money(r.unitCost) },
    { key: 'total', label: 'Total', render: (r) => money(r.total) },
    { key: 'date', label: 'Order Date' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'productId', label: 'Product ID', type: 'text', required: true },
    { key: 'date', label: 'Order Date', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Received', 'Cancelled'] },
    { key: 'qty', label: 'Quantity', type: 'number', required: true },
    { key: 'unitCost', label: 'Unit Cost', type: 'number', required: true },
    { key: 'total', label: 'Total Amount', type: 'number' },
    { key: 'deliveryDate', label: 'Delivery Date', type: 'date', advanced: true },
    { key: 'terms', label: 'Payment Terms', type: 'text', advanced: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ],
  kpi: (rows) => {
    const m = getPurchaseOrderMetrics(rows);
    return [
      { key: 'spend', label: 'Total Procured Spend', value: money(m.totalSpend) },
      { key: 'pending', label: 'Pending POs', value: String(m.pending) },
      { key: 'received', label: 'Received POs', value: String(m.received) },
      { key: 'draft', label: 'Draft POs', value: String(m.draft) },
    ];
  },
  adapter: adapter({
    list: listPurchases,
    create: createPurchaseOrder,
    update: updatePurchaseOrder,
    delete: deletePurchaseOrder,
    getInitialForm: () => ({ date: new Date().toISOString().split('T')[0], status: 'Draft' }),
  }),
  computedFields: {
    total: (form) => String(Number(form.qty || 0) * Number(form.unitCost || 0)),
  },
  rowActions: (row, { appState, save }) => {
    const id = String(row.id);
    const status = String(row.status);
    const actions: React.ReactNode[] = [];
    const btnCls = 'font-bold cursor-pointer text-[10px]';
    if (status === 'Draft') {
      actions.push(React.createElement('button', {
        key: 'send', type: 'button',
        className: `text-blue-600 ${btnCls}`,
        onClick: () => { const r = sendPurchaseOrder(appState, id); if (r.ok) save(); else toast.error('Could not send PO', { module: 'Purchases', description: String(r.error) }); },
      }, 'Send'));
    }
    if (status === 'Sent') {
      actions.push(React.createElement('button', {
        key: 'recv', type: 'button',
        className: `text-emerald-600 ${btnCls}`,
        onClick: () => { const r = receivePurchaseOrder(appState, id); if (r.ok) save(); else toast.error('Could not receive PO', { module: 'Purchases', description: String(r.error) }); },
      }, 'Receive'));
    }
    if (status === 'Draft' || status === 'Sent') {
      actions.push(React.createElement('button', {
        key: 'cancel', type: 'button',
        className: `text-slate-500 ${btnCls}`,
        onClick: () => { confirmAction({ title: 'Cancel PO', message: 'Cancel this purchase order?', confirmLabel: 'Cancel PO', tone: 'danger', module: 'Purchases' }).then((__ok) => { if (!__ok) return; const r = cancelPurchaseOrder(appState, id); if (r.ok) save(); }); },
      }, 'Cancel'));
    }
    return React.createElement(React.Fragment, null, ...actions);
  },
};

export const CONFIGS: Record<string, DedicatedModuleConfig> = {
  'purchases-suppliers': {
    id: 'purchases-suppliers',
    title: 'Suppliers',
    subtitle: 'Manage vendor profiles, credit terms, and ratings.',
    addLabel: 'Add Supplier',
    searchKeys: ['name', 'contact', 'phone'],
    columns: [
      { key: 'name', label: 'Supplier' },
      { key: 'contact', label: 'Contact' },
      { key: 'phone', label: 'Phone' },
      { key: 'terms', label: 'Terms' },
      { key: 'due', label: 'Outstanding', render: (r) => money(r.due) },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Supplier Name', type: 'text', required: true },
      { key: 'contact', label: 'Contact Person', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'credit-hold'] },
      { key: 'terms', label: 'Payment Terms', type: 'text' },
      { key: 'lead', label: 'Lead Time', type: 'text' },
      { key: 'email', label: 'Email', type: 'email', advanced: true },
      { key: 'rating', label: 'Rating (1-5)', type: 'number', advanced: true },
      { key: 'address', label: 'Address', type: 'textarea', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      kpiCount('total', 'Total Suppliers', rows.length),
      kpiCount('active', 'Active', countStatus(rows, 'active')),
      kpiCount('inactive', 'Inactive / Hold', countStatusIn(rows, ['inactive', 'credit-hold'])),
      kpiMoneySum('due', 'Total Outstanding', rows, 'due'),
    ],
    adapter: adapter({ list: listSuppliers, create: createSupplier, update: updateSupplier, delete: deleteSupplier }),
  },

  'purchases-orders': purchasesOrdersConfig,

  'purchases-goods-received': {
    ...PORT_CONFIGS['purchases-goods-received'],
    title: 'Goods Received',
    subtitle: 'Record goods received notes and update stock.',
    addLabel: 'New GRN',
    searchKeys: ['id', 'supplier', 'product'],
    columns: [
      { key: 'id', label: 'GRN #' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'product', label: 'Product' },
      { key: 'qty', label: 'Qty Received' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'supplier', label: 'Supplier', type: 'text', required: true },
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'qty', label: 'Quantity', type: 'number', required: true },
      { key: 'date', label: 'Received Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed', 'pending'] },
      { key: 'ref', label: 'PO Reference', type: 'text', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      kpiCount('count', 'Total GRNs', rows.length),
      kpiCount('open', 'Open', countStatus(rows, 'open')),
      kpiCount('closed', 'Closed', countStatus(rows, 'closed')),
      kpiCount('qty', 'Total Qty Received', sumField(rows, 'qty')),
    ],
    adapter: adapter({
      list: listGoodsReceived,
      create: createGoodsReceived,
      update: (s, id, p) => updateInState(s, 'goodsReceived', id, p),
      delete: (s, id) => deleteFromState(s, 'goodsReceived', id),
      getInitialForm: () => ({ date: new Date().toISOString().split('T')[0], status: 'open' }),
    }),
  },

  'purchases-bills': {
    id: 'purchases-bills',
    title: 'Vendor Bills',
    subtitle: 'Manage supplier bills and payment due dates.',
    addLabel: 'Add Bill',
    searchKeys: ['id', 'supplier'],
    columns: [
      { key: 'id', label: 'Bill #' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'supplier', label: 'Supplier', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'posted', 'paid'] },
      { key: 'ref', label: 'Reference', type: 'text', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      kpiCount('total', 'Total Bills', rows.length),
      kpiMoneySum('amount', 'Total Amount', rows, 'amount'),
      kpiCount('unpaid', 'Unpaid', rows.filter((r) => r.status !== 'paid').length),
      kpiCount('paid', 'Paid', countStatus(rows, 'paid')),
    ],
    adapter: adapter({
      list: listVendorBills,
      create: (s, p) => createInState(s, 'vendorBills', p, 'BILL'),
      update: (s, id, p) => updateInState(s, 'vendorBills', id, p),
      delete: (s, id) => deleteFromState(s, 'vendorBills', id),
    }),
  },

  'purchases-payments': {
    id: 'purchases-payments',
    title: 'Purchase Payments',
    subtitle: 'Record supplier payments against bills.',
    addLabel: 'Record Payment',
    searchKeys: ['id', 'supplier'],
    columns: [
      { key: 'id', label: 'Payment #' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'supplier', label: 'Supplier', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'date', label: 'Payment Date', type: 'date' },
      { key: 'method', label: 'Method', type: 'select', options: ['Cash', 'Bank Transfer', 'Cheque'] },
      { key: 'status', label: 'Status', type: 'select', options: ['paid', 'pending'] },
      { key: 'ref', label: 'Bill Reference', type: 'text', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      kpiCount('total', 'Total Payments', rows.length),
      kpiMoneySum('paid', 'Total Paid', rows, 'amount'),
      kpiCount('pending', 'Pending', countStatus(rows, 'pending')),
      kpiCount('completed', 'Paid', countStatus(rows, 'paid')),
    ],
    adapter: adapter({
      list: listPurchasePayments,
      create: (s, p) => createInState(s, 'purchasePayments', p, 'PP'),
      update: (s, id, p) => updateInState(s, 'purchasePayments', id, p),
      delete: (s, id) => deleteFromState(s, 'purchasePayments', id),
    }),
  },

  'purchases-returns': {
    id: 'purchases-returns',
    title: 'Purchase Returns',
    subtitle: 'Process returns to suppliers.',
    addLabel: 'New Return',
    searchKeys: ['id', 'supplier'],
    columns: [
      { key: 'id', label: 'Return #' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'product', label: 'Product' },
      { key: 'qty', label: 'Qty' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'supplier', label: 'Supplier', type: 'text', required: true },
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'qty', label: 'Quantity', type: 'number', required: true },
      { key: 'reason', label: 'Reason', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed', 'pending'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      kpiCount('total', 'Total Returns', rows.length),
      kpiCount('open', 'Open', countStatus(rows, 'open')),
      kpiCount('closed', 'Closed', countStatus(rows, 'closed')),
      kpiCount('qty', 'Total Return Qty', sumField(rows, 'qty')),
    ],
    adapter: adapter({
      list: listPurchaseReturns,
      create: (s, p) => createInState(s, 'purchaseReturns', p, 'PR'),
      update: (s, id, p) => updateInState(s, 'purchaseReturns', id, p),
      delete: (s, id) => deleteFromState(s, 'purchaseReturns', id),
    }),
  },

  'purchases-recipes': {
    id: 'purchases-recipes',
    title: 'Recipes (BOM)',
    subtitle: 'Bill of materials for purchased components.',
    addLabel: 'Add Recipe',
    searchKeys: ['product', 'name'],
    columns: [
      { key: 'id', label: 'Recipe #' },
      { key: 'product', label: 'Product' },
      { key: 'components', label: 'Components' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'components', label: 'Components (comma-separated)', type: 'textarea', required: true },
      { key: 'yield', label: 'Yield Qty', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      kpiCount('total', 'Total Recipes', rows.length),
      kpiCount('active', 'Active', countStatus(rows, 'active')),
      kpiCount('inactive', 'Inactive', countStatus(rows, 'inactive')),
      kpiCount('withComponents', 'With Components', rows.filter((r) => String(r.components ?? '').trim().length > 0).length),
    ],
    adapter: adapter({
      list: listRecipes,
      create: (s, p) => {
        const product = String(p.product ?? '');
        const model = String(p.model ?? p.productSku ?? product);
        return createRecipe(s, {
          product,
          model,
          status: String(p.status ?? 'active'),
          notes: String(p.notes ?? ''),
        }, 'finished-goods');
      },
      update: (s, id, p) => updateRecipe(s, id, p),
      delete: (s, id) => deleteRecipe(s, id),
    }),
  },
} as Record<string, DedicatedModuleConfig>;
export { sendPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder };
