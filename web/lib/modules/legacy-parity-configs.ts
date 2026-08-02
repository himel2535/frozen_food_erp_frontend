'use client';

import React from 'react';
import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import type { PortAdapter } from '@/lib/modules/port-types';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';
import { formatCurrency } from '@/lib/services/domain-service';
import {
  listSuppliers, createSupplier, updateSupplier, deleteSupplier,
  listPurchases, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getPurchaseOrderMetrics, sendPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
  listGoodsReceived, listVendorBills, listPurchasePayments, listPurchaseReturns, listRecipes,
  createGoodsReceived,
} from '@/lib/services/purchases-service';
import {
  listProductionOrders, createProductionOrder, updateProductionOrder, deleteProductionOrder,
  startProductionOrder, completeProductionOrder,
  listBom, createBomEntry, updateBomEntry, deleteBomEntry,
  crudFactory,
} from '@/lib/services/manufacturing-service';
import {
  listJournals, createJournalEntry, updateJournalEntry, deleteJournalEntry,
  listLedger, listDues, listTrialBalance, listProfitLoss, listBalanceSheet,
  getJournalMetrics, getLedgerMetrics, crudAccounting,
} from '@/lib/services/accounting-service';
import {
  listEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeMetrics,
  getEmployeeInitialForm, mapEmployeeRowToForm,
  listDepartments, listDesignations, listAttendance, listLeaveRequests,
  listSalaryStructures, listPayrollRuns, listPayrollSlips, crudHrm,
} from '@/lib/services/hrm-service';
import { getSalaryStructureMetrics, formatMoney as payrollMoney } from '@/lib/services/payroll-service';
import { listFromState, createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { crmActivityAdapter } from '@/lib/modules/port-adapters';
import type { AppState } from '@/lib/state/types';

type Row = Record<string, unknown>;

function adapter(ops: {
  list: (s: AppState) => Row[];
  create?: (s: AppState, p: Row) => { ok: boolean; error?: string; id?: string };
  update?: (s: AppState, id: string, p: Row) => { ok: boolean; error?: string };
  delete?: (s: AppState, id: string) => { ok: boolean; error?: string };
  getInitialForm?: (s: AppState) => Row;
  mapRowToForm?: (row: Row) => Row;
}): PortAdapter {
  return ops as PortAdapter;
}

function money(v: unknown) {
  return formatCurrency(Number(v ?? 0));
}

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
        onClick: () => { const r = sendPurchaseOrder(appState, id); if (r.ok) save(); else window.alert(r.error); },
      }, 'Send'));
    }
    if (status === 'Sent') {
      actions.push(React.createElement('button', {
        key: 'recv', type: 'button',
        className: `text-emerald-600 ${btnCls}`,
        onClick: () => { const r = receivePurchaseOrder(appState, id); if (r.ok) save(); else window.alert(r.error); },
      }, 'Receive'));
    }
    if (status === 'Draft' || status === 'Sent') {
      actions.push(React.createElement('button', {
        key: 'cancel', type: 'button',
        className: `text-slate-500 ${btnCls}`,
        onClick: () => { if (window.confirm('Cancel PO?')) { const r = cancelPurchaseOrder(appState, id); if (r.ok) save(); } },
      }, 'Cancel'));
    }
    return React.createElement(React.Fragment, null, ...actions);
  },
};

export const LEGACY_PARITY_CONFIGS: Record<string, DedicatedModuleConfig> = {
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
      { key: 'total', label: 'Total Suppliers', value: String(rows.length) },
      { key: 'active', label: 'Active', value: String(rows.filter((r) => String(r.status) === 'active').length) },
      { key: 'due', label: 'Total Outstanding', value: money(rows.reduce((s, r) => s + Number(r.due ?? 0), 0)) },
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
      { key: 'count', label: 'Total GRNs', value: String(rows.length) },
      { key: 'qty', label: 'Total Qty Received', value: String(rows.reduce((s, r) => s + Number(r.qty ?? 0), 0)) },
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
      { key: 'total', label: 'Total Bills', value: String(rows.length) },
      { key: 'amount', label: 'Total Amount', value: money(rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)) },
      { key: 'unpaid', label: 'Unpaid', value: String(rows.filter((r) => r.status !== 'paid').length) },
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
      { key: 'total', label: 'Total Payments', value: String(rows.length) },
      { key: 'paid', label: 'Total Paid', value: money(rows.reduce((s, r) => s + Number(r.amount ?? 0), 0)) },
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
    kpi: (rows) => [{ key: 'total', label: 'Total Returns', value: String(rows.length) }],
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
      { key: 'total', label: 'Total Recipes', value: String(rows.length) },
      { key: 'active', label: 'Active', value: String(rows.filter((r) => r.status === 'active').length) },
    ],
    adapter: adapter({
      list: listRecipes,
      create: (s, p) => createInState(s, 'recipes', p, 'RCP'),
      update: (s, id, p) => updateInState(s, 'recipes', id, p),
      delete: (s, id) => deleteFromState(s, 'recipes', id),
    }),
  },

  'manufacturing-orders': {
    id: 'manufacturing-orders',
    title: 'Production Orders',
    subtitle: 'Schedule and track manufacturing production runs.',
    addLabel: 'New Production Order',
    searchKeys: ['id', 'product', 'bomId'],
    columns: [
      { key: 'id', label: 'Order #' },
      { key: 'product', label: 'Product' },
      { key: 'plannedQuantity', label: 'Planned Qty' },
      { key: 'actualQuantity', label: 'Actual Qty' },
      { key: 'startDate', label: 'Start' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'bomId', label: 'BOM ID', type: 'text', required: true },
      { key: 'plannedQuantity', label: 'Planned Quantity', type: 'number', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Completed', 'Cancelled'] },
      { key: 'machineId', label: 'Machine ID', type: 'text', advanced: true },
      { key: 'moldId', label: 'Mold ID', type: 'text', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Orders', value: String(rows.length) },
      { key: 'progress', label: 'In Progress', value: String(rows.filter((r) => r.status === 'In Progress').length) },
      { key: 'done', label: 'Completed', value: String(rows.filter((r) => r.status === 'Completed').length) },
    ],
    adapter: adapter({
      list: listProductionOrders,
      create: createProductionOrder,
      update: updateProductionOrder,
      delete: deleteProductionOrder,
      getInitialForm: () => ({ startDate: new Date().toISOString().split('T')[0], status: 'Planned' }),
    }),
  },

  'manufacturing-bom': {
    id: 'manufacturing-bom',
    title: 'Raw Materials BOM',
    subtitle: 'Define bill of materials for production.',
    addLabel: 'Add BOM',
    searchKeys: ['product', 'id'],
    columns: [
      { key: 'id', label: 'BOM #' },
      { key: 'product', label: 'Product' },
      { key: 'material', label: 'Material' },
      { key: 'qty', label: 'Qty Required' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'product', label: 'Finished Product', type: 'text', required: true },
      { key: 'material', label: 'Raw Material', type: 'text', required: true },
      { key: 'qty', label: 'Qty Required', type: 'number', required: true },
      { key: 'uom', label: 'Unit', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'BOM Lines', value: String(rows.length) }],
    adapter: adapter({ list: listBom, create: createBomEntry, update: updateBomEntry, delete: deleteBomEntry }),
  },

  'manufacturing-machine-maintenance': {
    id: 'manufacturing-machine-maintenance',
    title: 'Machine Maintenance',
    subtitle: 'Schedule and track machine maintenance.',
    addLabel: 'Schedule Maintenance',
    searchKeys: ['machine', 'technician'],
    columns: [
      { key: 'machine', label: 'Machine' },
      { key: 'type', label: 'Type' },
      { key: 'scheduledDate', label: 'Scheduled' },
      { key: 'technician', label: 'Technician' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'machine', label: 'Machine', type: 'text', required: true },
      { key: 'type', label: 'Maintenance Type', type: 'select', options: ['Preventive', 'Corrective', 'Inspection'] },
      { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
      { key: 'technician', label: 'Technician', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in-progress', 'completed'] },
      { key: 'cost', label: 'Cost', type: 'number', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Records', value: String(rows.length) },
      { key: 'scheduled', label: 'Scheduled', value: String(rows.filter((r) => r.status === 'scheduled').length) },
    ],
    adapter: adapter({ ...crudFactory('machineMaintenance', 'MM') }),
  },

  'manufacturing-mold-management': {
    id: 'manufacturing-mold-management',
    title: 'Mold Management',
    subtitle: 'Track molds and tooling lifecycle.',
    addLabel: 'Add Mold',
    searchKeys: ['mold', 'product'],
    columns: [
      { key: 'id', label: 'Mold ID' },
      { key: 'mold', label: 'Mold Name' },
      { key: 'product', label: 'Product' },
      { key: 'cycles', label: 'Cycles' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'mold', label: 'Mold Name', type: 'text', required: true },
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'cycles', label: 'Cycle Count', type: 'number' },
      { key: 'maxCycles', label: 'Max Cycles', type: 'number', advanced: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'maintenance', 'retired'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Molds', value: String(rows.length) },
      { key: 'active', label: 'Active', value: String(rows.filter((r) => r.status === 'active').length) },
    ],
    adapter: adapter({ ...crudFactory('molds', 'MOLD') }),
  },

  'manufacturing-wastage': {
    id: 'manufacturing-wastage',
    title: 'Wastage',
    subtitle: 'Record production wastage and scrap.',
    addLabel: 'Record Wastage',
    searchKeys: ['product', 'reason'],
    columns: [
      { key: 'id', label: 'Record #' },
      { key: 'product', label: 'Product' },
      { key: 'qty', label: 'Qty' },
      { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'qty', label: 'Quantity', type: 'number', required: true },
      { key: 'reason', label: 'Reason', type: 'select', options: ['Defect', 'Overflow', 'Setup', 'Other'] },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['recorded', 'reviewed'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Records', value: String(rows.length) },
      { key: 'qty', label: 'Total Wastage Qty', value: String(rows.reduce((s, r) => s + Number(r.qty ?? 0), 0)) },
    ],
    adapter: adapter({ ...crudFactory('wastage', 'WST') }),
  },

  'manufacturing-packing': {
    id: 'manufacturing-packing',
    title: 'Packing',
    subtitle: 'Packing and labeling operations.',
    addLabel: 'New Packing Batch',
    searchKeys: ['batch', 'product'],
    columns: [
      { key: 'batch', label: 'Batch' },
      { key: 'product', label: 'Product' },
      { key: 'qty', label: 'Packed Qty' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'batch', label: 'Batch #', type: 'text', required: true },
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'qty', label: 'Packed Quantity', type: 'number', required: true },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed', 'pending'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'batches', label: 'Total Batches', value: String(rows.length) },
      { key: 'packed', label: 'Total Packed', value: String(rows.reduce((s, r) => s + Number(r.qty ?? 0), 0)) },
    ],
    adapter: adapter({ ...crudFactory('packing', 'PKG') }),
  },

  'accounting-journals': {
    id: 'accounting-journals',
    title: 'Journal Entries',
    subtitle: 'Manual journal entries with debit/credit posting.',
    addLabel: 'New Journal Entry',
    searchKeys: ['account', 'desc', 'ref'],
    columns: [
      { key: 'id', label: 'Ref ID' },
      { key: 'account', label: 'Account' },
      { key: 'desc', label: 'Description' },
      { key: 'debit', label: 'Debit', render: (r) => money(r.debit) },
      { key: 'credit', label: 'Credit', render: (r) => money(r.credit) },
      { key: 'date', label: 'Date' },
    ],
    fields: [
      { key: 'account', label: 'Account', type: 'text', required: true },
      { key: 'desc', label: 'Description', type: 'text', required: true },
      { key: 'debit', label: 'Debit', type: 'number' },
      { key: 'credit', label: 'Credit', type: 'number' },
      { key: 'date', label: 'Date', type: 'date', required: true },
    ],
    kpi: (rows) => {
      const m = getJournalMetrics(rows);
      return [
        { key: 'entries', label: 'Total Entries', value: String(m.totalEntries) },
        { key: 'debit', label: 'Total Debit Volume', value: money(m.totalDebit) },
        { key: 'pending', label: 'Pending Approvals', value: String(m.pending) },
      ];
    },
    adapter: adapter({
      list: listJournals,
      create: createJournalEntry,
      update: updateJournalEntry,
      delete: deleteJournalEntry,
      getInitialForm: () => ({ date: new Date().toISOString().split('T')[0] }),
    }),
  },

  'accounting-ledger': {
    id: 'accounting-ledger',
    title: 'General Ledger',
    subtitle: 'View general ledger entries and running balance.',
    addLabel: 'Add Entry',
    searchKeys: ['ref', 'account', 'desc'],
    columns: [
      { key: 'ref', label: 'Ref' },
      { key: 'date', label: 'Date' },
      { key: 'account', label: 'Account' },
      { key: 'desc', label: 'Description' },
      { key: 'debit', label: 'Debit', render: (r) => money(r.debit) },
      { key: 'credit', label: 'Credit', render: (r) => money(r.credit) },
      { key: 'balance', label: 'Balance', render: (r) => money(r.balance) },
    ],
    fields: [
      { key: 'account', label: 'Account', type: 'text', required: true },
      { key: 'desc', label: 'Description', type: 'text', required: true },
      { key: 'debit', label: 'Debit', type: 'number' },
      { key: 'credit', label: 'Credit', type: 'number' },
      { key: 'date', label: 'Date', type: 'date' },
    ],
    kpi: (rows) => {
      const m = getLedgerMetrics(rows);
      return [
        { key: 'entries', label: 'Total Entries', value: String(m.totalEntries) },
        { key: 'balance', label: 'Net Balance', value: money(m.netBalance) },
      ];
    },
    adapter: adapter({
      list: listLedger,
      create: (s, p) => {
        const ledger = listLedger(s);
        const lastBal = ledger.length ? Number(ledger[ledger.length - 1].balance ?? 0) : 0;
        const debit = Number(p.debit ?? 0);
        const credit = Number(p.credit ?? 0);
        return createInState(s, 'accounting', { ...p, balance: lastBal + credit - debit, ref: p.ref ?? `TXN-${Date.now().toString().slice(-6)}` }, 'TXN');
      },
      update: (s, id, p) => updateInState(s, 'accounting', id, p),
      delete: (s, id) => deleteFromState(s, 'accounting', id),
    }),
  },

  'accounting-dues': {
    id: 'accounting-dues',
    title: 'Due Management',
    subtitle: 'Overview of receivables and payables.',
    addLabel: 'Add Due Record',
    searchKeys: ['party', 'type'],
    columns: [
      { key: 'party', label: 'Party' },
      { key: 'type', label: 'Type' },
      { key: 'due', label: 'Amount Due', render: (r) => money(r.due) },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'party', label: 'Party', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['receivable', 'payable'] },
      { key: 'due', label: 'Amount Due', type: 'number', required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'recv', label: 'Receivables', value: money(rows.filter((r) => r.type === 'receivable').reduce((s, r) => s + Number(r.due ?? 0), 0)) },
      { key: 'pay', label: 'Payables', value: money(rows.filter((r) => r.type === 'payable').reduce((s, r) => s + Number(r.due ?? 0), 0)) },
    ],
    adapter: adapter({ ...crudAccounting('dues', 'DUE') }),
  },
};

// Accounting receivables/payables/trial/pl/balance (defined after initial object)
LEGACY_PARITY_CONFIGS['accounting-receivables'] = {
  id: 'accounting-receivables',
  title: 'Customer Due (Cash)',
  subtitle: 'Track customer receivables.',
  addLabel: 'Add Receivable',
  searchKeys: ['name', 'company'],
  columns: [
    { key: 'name', label: 'Customer' },
    { key: 'company', label: 'Company' },
    { key: 'due', label: 'Due', render: (r) => money(r.due) },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { key: 'name', label: 'Customer', type: 'text', required: true },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'due', label: 'Amount Due', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'overdue', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ],
  kpi: (rows) => [
    { key: 'total', label: 'Total Due', value: money(rows.reduce((s, r) => s + Number(r.due ?? 0), 0)) },
    { key: 'overdue', label: 'Overdue Accounts', value: String(rows.filter((r) => r.status === 'overdue').length) },
  ],
  adapter: adapter({
    list: (s) => listFromState(s, 'crmCustomers'),
    update: (s, id, p) => updateInState(s, 'crmCustomers', id, p),
  }),
};

LEGACY_PARITY_CONFIGS['accounting-payables'] = {
  id: 'accounting-payables',
  title: 'Supplier Due (Bank)',
  subtitle: 'Track supplier payables.',
  addLabel: 'Add Payable',
  searchKeys: ['name'],
  columns: [
    { key: 'name', label: 'Supplier' },
    { key: 'due', label: 'Due', render: (r) => money(r.due) },
    { key: 'balance', label: 'Balance', render: (r) => money(r.balance) },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { key: 'name', label: 'Supplier', type: 'text', required: true },
    { key: 'due', label: 'Amount Due', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ],
  kpi: (rows) => [{ key: 'total', label: 'Total Payables', value: money(rows.reduce((s, r) => s + Number(r.due ?? 0), 0)) }],
  adapter: adapter({
    list: listSuppliers,
    update: (s, id, p) => updateSupplier(s, id, p),
  }),
};

LEGACY_PARITY_CONFIGS['accounting-trial'] = {
  id: 'accounting-trial',
  title: 'Trial Balance',
  subtitle: 'Trial balance report entries.',
  addLabel: 'Add Line',
  searchKeys: ['account'],
  columns: [
    { key: 'account', label: 'Account' },
    { key: 'debit', label: 'Debit', render: (r) => money(r.debit) },
    { key: 'credit', label: 'Credit', render: (r) => money(r.credit) },
  ],
  fields: [
    { key: 'account', label: 'Account', type: 'text', required: true },
    { key: 'debit', label: 'Debit', type: 'number' },
    { key: 'credit', label: 'Credit', type: 'number' },
  ],
  kpi: (rows) => [
    { key: 'debit', label: 'Total Debit', value: money(rows.reduce((s, r) => s + Number(r.debit ?? 0), 0)) },
    { key: 'credit', label: 'Total Credit', value: money(rows.reduce((s, r) => s + Number(r.credit ?? 0), 0)) },
  ],
  adapter: adapter({ ...crudAccounting('trialBalance', 'TB') }),
};

LEGACY_PARITY_CONFIGS['accounting-pl'] = {
  id: 'accounting-pl',
  title: 'Profit & Loss',
  subtitle: 'Profit and loss statement lines.',
  addLabel: 'Add Line',
  searchKeys: ['line', 'category'],
  columns: [
    { key: 'line', label: 'Line Item' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
  ],
  fields: [
    { key: 'line', label: 'Line Item', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Revenue', 'COGS', 'Expense', 'Other'] },
    { key: 'amount', label: 'Amount', type: 'number' },
  ],
  kpi: (rows) => {
    const revenue = rows.filter((r) => r.category === 'Revenue').reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const expense = rows.filter((r) => r.category !== 'Revenue').reduce((s, r) => s + Number(r.amount ?? 0), 0);
    return [
      { key: 'revenue', label: 'Total Revenue', value: money(revenue) },
      { key: 'net', label: 'Net P&L', value: money(revenue - expense) },
    ];
  },
  adapter: adapter({ ...crudAccounting('profitLoss', 'PL') }),
};

LEGACY_PARITY_CONFIGS['accounting-balance'] = {
  id: 'accounting-balance',
  title: 'Balance Sheet',
  subtitle: 'Balance sheet line items.',
  addLabel: 'Add Line',
  searchKeys: ['line', 'section'],
  columns: [
    { key: 'line', label: 'Line Item' },
    { key: 'section', label: 'Section' },
    { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
  ],
  fields: [
    { key: 'line', label: 'Line Item', type: 'text', required: true },
    { key: 'section', label: 'Section', type: 'select', options: ['Assets', 'Liabilities', 'Equity'] },
    { key: 'amount', label: 'Amount', type: 'number' },
  ],
  kpi: (rows) => {
    const assets = rows.filter((r) => r.section === 'Assets').reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const liab = rows.filter((r) => r.section === 'Liabilities').reduce((s, r) => s + Number(r.amount ?? 0), 0);
    return [
      { key: 'assets', label: 'Total Assets', value: money(assets) },
      { key: 'liab', label: 'Total Liabilities', value: money(liab) },
    ];
  },
  adapter: adapter({ ...crudAccounting('balanceSheet', 'BS') }),
};

// HRM + Payroll
Object.assign(LEGACY_PARITY_CONFIGS, {
  'hrm-employees': {
    id: 'hrm-employees',
    title: 'Employees',
    subtitle: 'Employee directory and profiles.',
    addLabel: 'Register Employee',
    searchKeys: ['name', 'email', 'department'],
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'phone', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'joiningDate', label: 'Joining Date', type: 'date', required: true },
      { key: 'email', label: 'Email', type: 'email', advanced: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'on-leave'], advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => {
      const m = getEmployeeMetrics(rows);
      return [
        { key: 'total', label: 'Total Employees', value: String(m.total) },
        { key: 'active', label: 'Active', value: String(m.active) },
        { key: 'leave', label: 'On Leave', value: String(m.onLeave) },
        { key: 'inactive', label: 'Inactive', value: String(m.inactive) },
        { key: 'payroll', label: 'Monthly Payroll', value: money(m.monthlyPayroll), sub: 'Active staff only' },
      ];
    },
    adapter: adapter({
      list: listEmployees,
      create: createEmployee,
      update: updateEmployee,
      delete: deleteEmployee,
      getInitialForm: getEmployeeInitialForm,
      mapRowToForm: mapEmployeeRowToForm,
    }),
  },
  'hrm-departments': {
    id: 'hrm-departments',
    title: 'Departments',
    subtitle: 'Organizational departments.',
    addLabel: 'Add Department',
    searchKeys: ['name', 'head'],
    columns: [{ key: 'name', label: 'Department' }, { key: 'head', label: 'Head' }, { key: 'status', label: 'Status' }],
    fields: [
      { key: 'name', label: 'Department Name', type: 'text', required: true },
      { key: 'head', label: 'Department Head', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Departments', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('departments', 'DEPT') }),
  },
  'hrm-designations': {
    id: 'hrm-designations',
    title: 'Designations',
    subtitle: 'Job titles and designations.',
    addLabel: 'Add Designation',
    searchKeys: ['title', 'department'],
    columns: [{ key: 'title', label: 'Title' }, { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Designations', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('designations', 'DES') }),
  },
  'hrm-attendance': {
    id: 'hrm-attendance',
    title: 'Attendance',
    subtitle: 'Daily attendance records.',
    addLabel: 'Record Attendance',
    searchKeys: ['employeeId', 'date'],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'employeeId', label: 'Employee' },
      { key: 'checkIn', label: 'Check In' },
      { key: 'checkOut', label: 'Check Out' },
      { key: 'workingHours', label: 'Hours' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'employeeId', label: 'Employee ID', type: 'text', required: true },
      { key: 'checkIn', label: 'Check In', type: 'text' },
      { key: 'checkOut', label: 'Check Out', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Present', 'Absent', 'Late', 'On Leave'] },
      { key: 'workingHours', label: 'Working Hours', type: 'number', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'present', label: 'Present Today', value: String(rows.filter((r) => r.status === 'Present').length) },
      { key: 'absent', label: 'Absent', value: String(rows.filter((r) => r.status === 'Absent').length) },
    ],
    adapter: adapter({ ...crudHrm('attendance', 'ATT') }),
  },
  'hrm-leave': {
    id: 'hrm-leave',
    title: 'Leave Management',
    subtitle: 'Leave requests and balances.',
    addLabel: 'New Leave Request',
    searchKeys: ['employee', 'type'],
    columns: [
      { key: 'employee', label: 'Employee' },
      { key: 'type', label: 'Leave Type' },
      { key: 'startDate', label: 'Start' },
      { key: 'endDate', label: 'End' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'employee', label: 'Employee', type: 'text', required: true },
      { key: 'type', label: 'Leave Type', type: 'select', options: ['annual', 'sick', 'casual', 'unpaid'] },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'pending', label: 'Pending Requests', value: String(rows.filter((r) => r.status === 'pending').length) },
      { key: 'approved', label: 'Approved', value: String(rows.filter((r) => r.status === 'approved').length) },
    ],
    adapter: adapter({ ...crudHrm('leaveRequests', 'LV') }),
  },
  'payroll-structures': {
    id: 'payroll-structures',
    title: 'Salary Setup',
    subtitle: 'Manage salary components, deduction rules, and employee assignments.',
    addLabel: 'Add Structure',
    searchKeys: ['name', 'code', 'employeeType'],
    statusTabs: [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'inactive', label: 'Inactive' },
    ],
    columns: [
      { key: 'name', label: 'Structure' },
      { key: 'employeeType', label: 'Employee Type' },
      { key: 'payFrequency', label: 'Pay Frequency' },
      { key: 'base', label: 'Base Salary' },
      { key: 'totalFixed', label: 'Total Fixed' },
      { key: 'assignedCount', label: 'Employees' },
      { key: 'effectiveFrom', label: 'Effective From' },
      { key: 'rules', label: 'Rules' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Structure Name', type: 'text', required: true },
      { key: 'base', label: 'Base Salary', type: 'number', required: true },
      { key: 'allowances', label: 'Allowances', type: 'number' },
      { key: 'deductions', label: 'Default Deductions', type: 'number', advanced: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => {
      const m = getSalaryStructureMetrics(rows);
      return [
        { key: 'total', label: 'Total Structures', value: String(m.total), iconify: 'flat-color-icons:rules' },
        { key: 'active', label: 'Active', value: String(m.active), iconify: 'flat-color-icons:ok' },
        { key: 'assigned', label: 'Employees Assigned', value: String(m.assignedEmployees), iconify: 'flat-color-icons:manager' },
        { key: 'payroll', label: 'Monthly Payroll', value: payrollMoney(m.monthlyPayroll), sub: 'Active structures', iconify: 'flat-color-icons:paid' },
        { key: 'avgBase', label: 'Avg Base Salary', value: payrollMoney(m.avgBase), sub: 'Per active structure', iconify: 'flat-color-icons:currency-exchange' },
      ];
    },
    adapter: adapter({ ...crudHrm('salaryStructures', 'SS') }),
  },
  'payroll-runs': {
    id: 'payroll-runs',
    title: 'Payroll Runs',
    subtitle: 'Process payroll batches.',
    addLabel: 'New Payroll Run',
    searchKeys: ['period'],
    columns: [
      { key: 'period', label: 'Period' },
      { key: 'employees', label: 'Employees' },
      { key: 'totalNet', label: 'Total Net', render: (r) => money(r.totalNet) },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'period', label: 'Pay Period', type: 'text', required: true },
      { key: 'employees', label: 'Employee Count', type: 'number' },
      { key: 'totalNet', label: 'Total Net Pay', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'processing', 'completed'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'runs', label: 'Total Runs', value: String(rows.length) },
      { key: 'completed', label: 'Completed', value: String(rows.filter((r) => r.status === 'completed').length) },
    ],
    adapter: adapter({ ...crudHrm('payrollRuns', 'PR') }),
  },
  'payroll-slips': {
    id: 'payroll-slips',
    title: 'Payslips',
    subtitle: 'Employee payslips.',
    addLabel: 'Generate Payslip',
    searchKeys: ['name', 'id'],
    columns: [
      { key: 'id', label: 'Payslip #' },
      { key: 'name', label: 'Employee' },
      { key: 'base', label: 'Base', render: (r) => money(r.base) },
      { key: 'net', label: 'Net Pay', render: (r) => money(r.net) },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Employee', type: 'text', required: true },
      { key: 'base', label: 'Base Salary', type: 'number' },
      { key: 'allowances', label: 'Allowances', type: 'number' },
      { key: 'deductions', label: 'Deductions', type: 'number' },
      { key: 'net', label: 'Net Pay', type: 'number' },
      { key: 'date', label: 'Pay Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'approved', 'paid', 'Disbursed', 'Pending'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Payslips', value: String(rows.length) },
      { key: 'net', label: 'Total Disbursed', value: money(rows.reduce((s, r) => s + Number(r.net ?? 0), 0)) },
    ],
    adapter: adapter({
      list: listPayrollSlips,
      create: (s, p) => createInState(s, 'payroll', p, 'PAY'),
      update: (s, id, p) => updateInState(s, 'payroll', id, p),
      delete: (s, id) => deleteFromState(s, 'payroll', id),
    }),
  },
} as Record<string, DedicatedModuleConfig>);

// Settings + Misc
Object.assign(LEGACY_PARITY_CONFIGS, {
  'crm-activities': {
    ...(PORT_CONFIGS['crm-activities'] as DedicatedModuleConfig),
    kpi: (rows) => [{ key: 'total', label: 'Total Activities', value: String(rows.length) }],
  },
  'sales-wholesale': {
    id: 'sales-wholesale',
    title: 'Wholesale',
    subtitle: 'Wholesale order management.',
    addLabel: 'New Wholesale Order',
    searchKeys: ['buyer', 'id'],
    columns: [
      { key: 'id', label: 'Order #' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'total', label: 'Total', render: (r) => money(r.total) },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'buyer', label: 'Buyer', type: 'text', required: true },
      { key: 'total', label: 'Total', type: 'number', required: true },
      { key: 'qty', label: 'Quantity', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed', 'pending', 'cancelled'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'orders', label: 'Total Orders', value: String(rows.length) },
      { key: 'value', label: 'Total Value', value: money(rows.reduce((s, r) => s + Number(r.total ?? 0), 0)) },
    ],
    adapter: adapter({
      list: (s) => listFromState(s, 'wholesaleOrders'),
      create: (s, p) => createInState(s, 'wholesaleOrders', p, 'WS'),
      update: (s, id, p) => updateInState(s, 'wholesaleOrders', id, p),
      delete: (s, id) => deleteFromState(s, 'wholesaleOrders', id),
    }),
  },
  'settings-users': {
    id: 'settings-users',
    title: 'Users',
    subtitle: 'Manage system users and access.',
    addLabel: 'Add User',
    searchKeys: ['name', 'email', 'role'],
    columns: [
      { key: 'name', label: 'User' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'role', label: 'Role', type: 'select', options: ['Admin', 'Manager', 'User', 'Viewer'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
      { key: 'phone', label: 'Phone', type: 'phone', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Users', value: String(rows.length) },
      { key: 'active', label: 'Active', value: String(rows.filter((r) => r.status === 'Active').length) },
    ],
    adapter: adapter({ ...crudHrm('users', 'USR') }),
  },
  'settings-roles': {
    id: 'settings-roles',
    title: 'Roles',
    subtitle: 'Define user roles and permissions.',
    addLabel: 'Add Role',
    searchKeys: ['name'],
    columns: [{ key: 'name', label: 'Role' }, { key: 'users', label: 'Users' }, { key: 'status', label: 'Status' }],
    fields: [
      { key: 'name', label: 'Role Name', type: 'text', required: true },
      { key: 'users', label: 'User Count', type: 'number' },
      { key: 'permissions', label: 'Permissions Summary', type: 'textarea', advanced: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Roles', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('roles', 'ROLE') }),
  },
  'settings-permissions': {
    id: 'settings-permissions',
    title: 'Permissions',
    subtitle: 'Module-level access control.',
    addLabel: 'Add Permission',
    searchKeys: ['module'],
    columns: [{ key: 'module', label: 'Module' }, { key: 'access', label: 'Access' }, { key: 'role', label: 'Role' }],
    fields: [
      { key: 'module', label: 'Module', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'access', label: 'Access Level', type: 'select', options: ['none', 'read', 'write', 'admin'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Permission Rules', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('permissions', 'PERM') }),
  },
  'settings-documents': {
    id: 'settings-documents',
    title: 'Documents',
    subtitle: 'Document templates and settings.',
    addLabel: 'Add Document',
    searchKeys: ['name', 'type'],
    columns: [{ key: 'name', label: 'Document' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }],
    fields: [
      { key: 'name', label: 'Document Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['invoice', 'quotation', 'purchase-order', 'payslip'] },
      { key: 'template', label: 'Template ID', type: 'text', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Documents', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('documents', 'DOC') }),
  },
  'settings-company': {
    id: 'settings-company',
    title: 'Company Settings',
    subtitle: 'Company profile and configuration.',
    addLabel: 'Add Setting',
    searchKeys: ['field', 'value'],
    columns: [{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }],
    fields: [
      { key: 'field', label: 'Setting Field', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'text', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Settings', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('companySettings', 'SET') }),
  },
  'settings-profile': {
    id: 'settings-profile',
    title: 'Profile Settings',
    subtitle: 'User profile preferences.',
    addLabel: 'Add Preference',
    searchKeys: ['field'],
    columns: [{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }],
    fields: [
      { key: 'field', label: 'Preference', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'text', required: true },
    ],
    kpi: (rows) => [{ key: 'total', label: 'Preferences', value: String(rows.length) }],
    adapter: adapter({ ...crudHrm('profileSettings', 'PROF') }),
  },
  'projects': {
    id: 'projects',
    title: 'Projects',
    subtitle: 'Project tracking and milestones.',
    addLabel: 'New Project',
    searchKeys: ['name', 'lead'],
    columns: [
      { key: 'name', label: 'Project' },
      { key: 'lead', label: 'Lead' },
      { key: 'progress', label: 'Progress %' },
      { key: 'health', label: 'Health' },
      { key: 'deadline', label: 'Deadline' },
    ],
    fields: [
      { key: 'name', label: 'Project Name', type: 'text', required: true },
      { key: 'lead', label: 'Project Lead', type: 'text' },
      { key: 'progress', label: 'Progress %', type: 'number' },
      { key: 'health', label: 'Health', type: 'select', options: ['On Track', 'At Risk', 'Delayed', 'green', 'amber', 'red'] },
      { key: 'deadline', label: 'Deadline', type: 'date' },
      { key: 'budget', label: 'Budget', type: 'number', advanced: true },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Active Projects', value: String(rows.length) },
      { key: 'risk', label: 'At Risk', value: String(rows.filter((r) => String(r.health).includes('Risk') || r.health === 'amber').length) },
    ],
    adapter: adapter({
      list: (s) => listFromState(s, 'projects'),
      create: (s, p) => createInState(s, 'projects', p, 'PRJ'),
      update: (s, id, p) => updateInState(s, 'projects', id, p),
      delete: (s, id) => deleteFromState(s, 'projects', id),
    }),
  },
  'asset-management': {
    id: 'asset-management',
    title: 'Asset Management',
    subtitle: 'Track fixed assets and depreciation.',
    addLabel: 'Add Asset',
    searchKeys: ['asset', 'category'],
    columns: [
      { key: 'asset', label: 'Asset' },
      { key: 'category', label: 'Category' },
      { key: 'value', label: 'Value', render: (r) => money(r.value) },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'asset', label: 'Asset Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'disposed', 'maintenance'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'total', label: 'Total Assets', value: String(rows.length) },
      { key: 'value', label: 'Total Value', value: money(rows.reduce((s, r) => s + Number(r.value ?? 0), 0)) },
    ],
    adapter: adapter({ ...crudFactory('assets', 'AST') }),
  },
  'workflow-approvals': {
    id: 'workflow-approvals',
    title: 'Workflow Approvals',
    subtitle: 'Pending approval requests.',
    addLabel: 'New Request',
    searchKeys: ['item', 'requester', 'module'],
    statusTabs: [
      { id: 'all', label: 'All' },
      { id: 'pending', label: 'Pending' },
      { id: 'approved', label: 'Approved' },
      { id: 'rejected', label: 'Rejected' },
    ],
    columns: [
      { key: 'item', label: 'Item' },
      { key: 'requester', label: 'Requester' },
      { key: 'module', label: 'Module' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'item', label: 'Item', type: 'text', required: true },
      { key: 'requester', label: 'Requester', type: 'text' },
      { key: 'module', label: 'Module', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
      { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'pending', label: 'Pending', value: String(rows.filter((r) => r.status === 'pending').length) },
      { key: 'approved', label: 'Approved', value: String(rows.filter((r) => r.status === 'approved').length) },
    ],
    hideDefaultRowActions: (row) => String(row.refType) === 'purchase_rm_order',
    adapter: adapter({ ...crudFactory('approvals', 'APR') }),
  },
  'notifications': {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'System notifications and alerts.',
    addLabel: 'Add Notification',
    searchKeys: ['title'],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'time', label: 'Time' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'time', label: 'Time', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['info', 'warning', 'success', 'error'] },
      { key: 'status', label: 'Status', type: 'select', options: ['unread', 'read'] },
      { key: 'message', label: 'Message', type: 'textarea', advanced: true },
    ],
    kpi: (rows) => [
      { key: 'unread', label: 'Unread', value: String(rows.filter((r) => r.status === 'unread').length) },
      { key: 'total', label: 'Total', value: String(rows.length) },
    ],
    adapter: adapter({ ...crudFactory('notifications', 'NTF') }),
  },
} as Record<string, DedicatedModuleConfig>);

export function getLegacyParityConfig(id: string): DedicatedModuleConfig {
  return LEGACY_PARITY_CONFIGS[id] ?? (PORT_CONFIGS[id] as DedicatedModuleConfig);
}

export { sendPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, startProductionOrder, completeProductionOrder };
