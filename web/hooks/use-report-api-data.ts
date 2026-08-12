'use client';

import { useMemo } from 'react';
import { useApiAggregate } from '@/hooks/use-api-aggregate';
import type { ApiModule } from '@/lib/config/data-source';
import {
  mergeSalesReportSource,
  purchaseOrdersToReportRows,
  productsToInventoryReportRows,
  customersToReportRows,
  suppliersToReportRows,
  journalsToFinancialReportRows,
} from '@/lib/services/report-api-mappers';

const SALES_REPORT_MODULES = ['invoices', 'salesOrders'] as const satisfies readonly ApiModule[];
const PURCHASE_REPORT_MODULES = ['purchaseOrders'] as const satisfies readonly ApiModule[];
const INVENTORY_REPORT_MODULES = ['products', 'rawMaterials', 'finishedGoods', 'semiFinishedProducts', 'warehouses'] as const satisfies readonly ApiModule[];
const CUSTOMER_REPORT_MODULES = ['customers', 'invoices'] as const satisfies readonly ApiModule[];
const SUPPLIER_REPORT_MODULES = ['suppliers', 'purchaseOrders'] as const satisfies readonly ApiModule[];
const FINANCIAL_REPORT_MODULES = ['journals', 'ledger'] as const satisfies readonly ApiModule[];
const HR_REPORT_MODULES = ['employees', 'departments', 'leaveRequests'] as const satisfies readonly ApiModule[];

export function useSalesReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(SALES_REPORT_MODULES);
  const rows = useMemo(
    () => mergeSalesReportSource(data.invoices ?? [], data.salesOrders ?? []),
    [data.invoices, data.salesOrders],
  );
  return { rows, loading, initialized, error, reload };
}

export function usePurchaseReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(PURCHASE_REPORT_MODULES);
  const rows = useMemo(
    () => purchaseOrdersToReportRows(data.purchaseOrders ?? []),
    [data.purchaseOrders],
  );
  return { rows, loading, initialized, error, reload };
}

export function useInventoryReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(INVENTORY_REPORT_MODULES);
  const rows = useMemo(() => {
    const wh = data.warehouses ?? [];
    return [
      ...productsToInventoryReportRows(data.products ?? [], wh),
      ...productsToInventoryReportRows(data.rawMaterials ?? [], wh),
      ...productsToInventoryReportRows(data.finishedGoods ?? [], wh),
      ...productsToInventoryReportRows(data.semiFinishedProducts ?? [], wh),
    ];
  }, [data]);
  return { rows, loading, initialized, error, reload };
}

export function useCustomerReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(CUSTOMER_REPORT_MODULES);
  const rows = useMemo(() => {
    const customers = customersToReportRows(data.customers ?? []);
    const invoices = data.invoices ?? [];
    return customers.map((c) => {
      const custInvoices = invoices.filter(
        (inv) => String(inv.customerId ?? inv.customer) === String(c.id)
          || String(inv.customerName ?? '').toLowerCase() === String(c.name).toLowerCase(),
      );
      const totalSpent = custInvoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0);
      return { ...c, totalOrders: custInvoices.length, totalSpent };
    });
  }, [data.customers, data.invoices]);
  return { rows, loading, initialized, error, reload };
}

export function useSupplierReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(SUPPLIER_REPORT_MODULES);
  const rows = useMemo(() => {
    const suppliers = suppliersToReportRows(data.suppliers ?? []);
    const pos = data.purchaseOrders ?? [];
    return suppliers.map((s) => {
      const supplierPos = pos.filter(
        (po) => String(po.supplierId ?? po.supplier) === String(s.id)
          || String(po.supplier ?? '').toLowerCase() === String(s.name).toLowerCase(),
      );
      const totalSpend = supplierPos.reduce((sum, po) => sum + Number(po.total ?? 0), 0);
      return { ...s, totalOrders: supplierPos.length, totalSpend };
    });
  }, [data.suppliers, data.purchaseOrders]);
  return { rows, loading, initialized, error, reload };
}

export function useFinancialReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(FINANCIAL_REPORT_MODULES);
  const rows = useMemo(() => {
    const journalRows = journalsToFinancialReportRows(data.journals ?? []);
    const ledgerRows = (data.ledger ?? []).map((doc) => ({
      id: doc.id ?? doc.legacyId,
      date: String(doc.date ?? '').slice(0, 10),
      ref: doc.ref ?? doc.legacyId ?? doc.id,
      account: doc.account ?? '',
      desc: doc.desc ?? doc.description ?? '',
      debit: Number(doc.debit ?? 0),
      credit: Number(doc.credit ?? 0),
      category: doc.category ?? 'General',
    }));
    return journalRows.length > 0 ? journalRows : ledgerRows;
  }, [data.journals, data.ledger]);
  return { rows, loading, initialized, error, reload };
}

export function useHrReportApiRows() {
  const { data, loading, initialized, error, reload } = useApiAggregate(HR_REPORT_MODULES);
  const rows = useMemo(() => {
    const employees = (data.employees ?? []) as Record<string, unknown>[];
    const departments = (data.departments ?? []) as Record<string, unknown>[];

    const departmentRows = departments.map((doc) => {
      const deptName = String(doc.name ?? doc.department ?? '');
      const deptEmployees = employees.filter((e) => String(e.department) === deptName);
      const male = deptEmployees.filter((e) => String(e.gender).toLowerCase() === 'male').length;
      const female = deptEmployees.filter((e) => String(e.gender).toLowerCase() === 'female').length;
      return {
        id: doc.id ?? doc.legacyId,
        department: deptName,
        total: deptEmployees.length || Number(doc.employees ?? doc.employeeCount ?? 0),
        male,
        female,
        joined: 0,
        left: 0,
        netChange: 0,
      };
    });

    const joinerRows = employees.map((e) => ({
      id: e.id ?? e.legacyId,
      employeeId: e.legacyId ?? e.id,
      name: e.name ?? '',
      department: e.department ?? '',
      designation: e.designation ?? '',
      joinDate: String(e.joiningDate ?? e.dateOfJoining ?? '').slice(0, 10),
    }));

    const leaverRows = (data.leaveRequests ?? []).map((l) => ({
      id: (l as Record<string, unknown>).id ?? (l as Record<string, unknown>).legacyId,
      employeeId: (l as Record<string, unknown>).employeeId ?? '',
      name: (l as Record<string, unknown>).employeeName ?? (l as Record<string, unknown>).name ?? '',
      department: (l as Record<string, unknown>).department ?? '',
      designation: (l as Record<string, unknown>).designation ?? '',
      leftDate: String((l as Record<string, unknown>).endDate ?? (l as Record<string, unknown>).date ?? '').slice(0, 10),
    }));

    const birthdayRows = employees
      .filter((e) => e.dateOfBirth || e.birthDate)
      .map((e) => ({
        id: e.id ?? e.legacyId,
        employeeId: e.legacyId ?? e.id,
        name: e.name ?? '',
        department: e.department ?? '',
        birthDate: String(e.dateOfBirth ?? e.birthDate ?? '').slice(0, 10),
      }));

    return {
      departments: departmentRows,
      joiners: joinerRows,
      leavers: leaverRows,
      birthdays: birthdayRows,
    };
  }, [data.departments, data.employees, data.leaveRequests]);
  return { rows, loading, initialized, error, reload };
}
