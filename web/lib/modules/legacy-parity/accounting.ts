'use client';

import {
  listJournals, createJournalEntry, updateJournalEntry, deleteJournalEntry,
  listLedger, getJournalMetrics, getLedgerMetrics, crudAccounting,
} from '@/lib/services/accounting-service';
import { listSuppliers, updateSupplier } from '@/lib/services/purchases-service';
import { listFromState, createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { adapter, money, type DedicatedModuleConfig } from './shared';
export const CONFIGS: Record<string, DedicatedModuleConfig> = {
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

CONFIGS['accounting-receivables'] = {
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

CONFIGS['accounting-payables'] = {
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

CONFIGS['accounting-trial'] = {
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

CONFIGS['accounting-pl'] = {
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

CONFIGS['accounting-balance'] = {
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
