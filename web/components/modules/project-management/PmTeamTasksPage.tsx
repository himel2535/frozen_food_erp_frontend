'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { ListPagination } from '@/components/shared/ListPagination';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { CF_BTN_GHOST } from '@/components/modules/crm/customer-form/customer-form-styles';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { toast } from '@/lib/ui/feedback';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { fetchResourceList } from '@/lib/services/api-resource-service';
import { fetchPmTeamOverview } from '@/lib/services/pm-service';
import { PmPersonCell } from '@/components/modules/project-management/PmPersonCell';
import { PmProgressBar } from '@/components/modules/project-management/PmProgressBar';

const PAGE_SIZE = 10;

export function PmTeamTasksPage() {
  const { formatCount } = useLocaleFormat();
  const [search, setSearch] = useState('');
  const [employeeId, setEmployeeId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totals, setTotals] = useState({
    totalEmployees: 0,
    totalTasks: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fetchResourceList(API_RESOURCE_PATHS.employees).then((list) => {
      setEmployees(list.map((row) => ({ id: String(row.id ?? row._id ?? ''), name: String(row.name ?? '') })).filter((row) => row.id));
    });
    void fetchResourceList(API_RESOURCE_PATHS.pmProjects).then((list) => {
      setProjects(list.map((row) => ({ id: String(row.id ?? row._id ?? ''), name: String(row.name ?? '') })).filter((row) => row.id));
    });
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await fetchPmTeamOverview({ employeeId, projectId, search });
      setRows(data.rows ?? []);
      setTotals(data.totals);
      setPage(1);
    } catch (err) {
      toast.error('Could not load team tasks', {
        module: 'Projects',
        description: err instanceof Error ? err.message : 'Try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [employeeId, projectId, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload(); }, 250);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const kpis = useMemo(
    () => [
      { key: 'employees', label: 'Total Employees', value: formatCount(totals.totalEmployees), sub: 'Active team members', iconify: 'flat-color-icons:manager' },
      { key: 'tasks', label: 'Total Tasks', value: formatCount(totals.totalTasks), sub: 'All assigned tasks', iconify: 'flat-color-icons:todo-list' },
      { key: 'pending', label: 'Pending Tasks', value: formatCount(totals.pending), sub: 'To Do + In Progress', iconify: 'flat-color-icons:clock' },
      { key: 'completed', label: 'Completed Tasks', value: formatCount(totals.completed), sub: 'Completed tasks', iconify: 'flat-color-icons:ok' },
      { key: 'overdue', label: 'Overdue Tasks', value: formatCount(totals.overdue), sub: 'Tasks past deadline', alert: totals.overdue > 0, iconify: 'flat-color-icons:high-priority' },
    ],
    [formatCount, totals],
  );

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <span className="inline-flex flex-col min-w-0">
          <PmPersonCell name={String(row.name ?? '')} imageUrl={String(row.imageUrl ?? '')} />
          <span className="text-[10px] text-slate-400 font-medium ml-9">{String(row.designation ?? row.department ?? '')}</span>
        </span>
      ),
    },
    { key: 'totalTasks', label: 'Total Tasks', render: (row) => <span className="tabular-nums font-semibold">{Number(row.totalTasks ?? 0)}</span> },
    { key: 'todo', label: 'To Do', render: (row) => <span className="tabular-nums text-blue-700 font-semibold">{Number(row.todo ?? 0)}</span> },
    { key: 'inProgress', label: 'In Progress', render: (row) => <span className="tabular-nums text-amber-700 font-semibold">{Number(row.inProgress ?? 0)}</span> },
    { key: 'completed', label: 'Completed', render: (row) => <span className="tabular-nums text-emerald-700 font-semibold">{Number(row.completed ?? 0)}</span> },
    { key: 'overdue', label: 'Overdue', render: (row) => <span className="tabular-nums text-rose-700 font-semibold">{Number(row.overdue ?? 0)}</span> },
    { key: 'progress', label: 'Progress', render: (row) => <PmProgressBar value={Number(row.progress ?? 0)} /> },
  ], []);

  if (loading && rows.length === 0) return <PageSkeleton variant="module-list" label="Loading team tasks" />;

  return (
    <>
      <ModuleFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employee..."
        filters={(
          <>
            <select className={MODULE_FILTER_INPUT} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <select className={MODULE_FILTER_INPUT} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </>
        )}
      />
      <ModuleKpiSection items={kpis} loading={loading} gridClassName={getKpiGridClassName(5)} kpiCount={5} />
      <div className="mt-4 premium-card overflow-hidden">
        <AppTable
          columns={columns}
          rows={pagedRows}
          loading={loading}
          emptyMessage="No employee task data found."
          renderActions={(row) => (
            <button
              type="button"
              className={CF_BTN_GHOST}
              onClick={() => setEmployeeId(String(row.id ?? ''))}
            >
              View Tasks
            </button>
          )}
        />
      </div>
      <ListPagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} />
      {totals.overdue > 0 ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {totals.overdue} overdue tasks across the team. Please review and take necessary action.
        </div>
      ) : null}
      <Footer />
    </>
  );
}
