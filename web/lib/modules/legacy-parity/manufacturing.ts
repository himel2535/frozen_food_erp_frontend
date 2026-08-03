'use client';

import {
  listProductionOrders, createProductionOrder, updateProductionOrder, deleteProductionOrder,
  startProductionOrder, completeProductionOrder,
  crudFactory,
} from '@/lib/services/manufacturing-service';
import { adapter, money, React, toast, confirmAction, type DedicatedModuleConfig } from './shared';
export const CONFIGS: Record<string, DedicatedModuleConfig> = {
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
} as Record<string, DedicatedModuleConfig>;
export { startProductionOrder, completeProductionOrder };
