'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { employeeAvatarClass, employeeInitials, getEmployeeMetrics } from '@/lib/services/hrm-service';
import { formatMoney } from '@/lib/services/payroll-service';
import { mapApiEmployeeRow } from '@/lib/services/entity-api-mappers';
import { confirmAction, toast } from '@/lib/ui/feedback';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { ModuleToolbarActions } from '@/components/shared/ListToolbar';

export function EmployeesApiPage() {
  const router = useRouter();
  const apiStore = usePaginatedApiResource('employees', mapApiEmployeeRow, { pageSize: 25 });
  const bootLoading = isModuleBootLoading(true, apiStore.initialized);
  const [localSearch, setLocalSearch] = useState('');

  const sourceRows = useMemo(
    () => pickApiListRows(true, apiStore.initialized, apiStore.rows, []),
    [apiStore.initialized, apiStore.rows],
  );

  const rows = sourceRows;

  const kpis = useMemo(() => {
    const m = getEmployeeMetrics(rows);
    return [
      { key: 'total', label: 'Total Employees', value: String(m.total) },
      { key: 'active', label: 'Active', value: String(m.active) },
      { key: 'leave', label: 'On Leave', value: String(m.onLeave) },
      { key: 'inactive', label: 'Inactive', value: String(m.inactive) },
      { key: 'payroll', label: 'Monthly Payroll', value: formatMoney(m.monthlyPayroll), sub: 'Active staff only' },
    ];
  }, [rows]);

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => String(row.employeeCode ?? row.id) },
    {
      key: 'name',
      label: 'Name',
      render: (row) => {
        const name = String(row.name ?? '—');
        return (
          <span className="inline-flex items-center gap-2">
            <InventoryItemThumb
              imageUrl={String(row.imageUrl ?? '')}
              alt={name}
              className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
              fallback={
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${employeeAvatarClass(name)}`}>
                  {employeeInitials(name)}
                </span>
              }
            />
            <span className="font-semibold text-slate-800">{name}</span>
          </span>
        );
      },
    },
    { key: 'department', label: 'Department', render: (row) => String(row.department ?? '—') },
    { key: 'designation', label: 'Designation', render: (row) => String(row.designation ?? '—') },
    { key: 'phone', label: 'Phone', render: (row) => String(row.phone ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ], []);

  useRegisterModuleActions(
    <ModuleToolbarActions onAdd={() => router.push('/hrm/employees/new')} addLabel="Register Employee" />,
    [router],
  );

  return (
    <>
      <ApiModeBanner module="employees" error={apiStore.error} />
      <ModuleKpiSection items={kpis} loading={bootLoading} gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" kpiCount={5} />
      <ModuleFilterBar
        search={apiStore.search || localSearch}
        onSearchChange={(v) => { apiStore.setSearchTerm(v); setLocalSearch(v); }}
        searchPlaceholder="Search employees..."
      />
      <AppTable
        columns={columns}
        rows={rows}
        loading={bootLoading}
        emptyMessage={apiStore.loading ? 'Loading employees…' : 'No employees found.'}
        rowClassName="cursor-pointer hover:bg-slate-50/80"
        onRowClick={(row) => router.push(`/hrm/employees/${String(row.id)}`)}
        renderActions={(row) => (
          <>
            <TableIconAction variant="view" onClick={() => router.push(`/hrm/employees/${String(row.id)}`)} />
            <TableIconAction variant="edit" onClick={() => router.push(`/hrm/employees/${String(row.id)}/edit`)} />
            <TableIconAction
              variant="delete"
              onClick={() => {
                confirmAction({ title: 'Delete employee', message: 'Delete this employee?', confirmLabel: 'Delete', tone: 'danger', module: 'Employees' }).then(async (ok) => {
                  if (!ok) return;
                  const result = await apiStore.remove(String(row.id));
                  if (!result.ok) toast.error('Delete failed', { module: 'Employees', description: result.error });
                });
              }}
            />
          </>
        )}
      />
      <ListPagination
        page={apiStore.page}
        pageSize={apiStore.pageSize}
        total={apiStore.meta.total}
        onPageChange={apiStore.setPage}
      />
      <Footer />
    </>
  );
}
