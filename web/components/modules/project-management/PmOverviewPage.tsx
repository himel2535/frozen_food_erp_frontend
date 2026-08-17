'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ListPagination } from '@/components/shared/ListPagination';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { isKpiBootLoading } from '@/lib/ui/kpi-loading';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { confirmAction, toast } from '@/lib/ui/feedback';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import { fetchResourceList } from '@/lib/services/api-resource-service';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import {
  deletePmProject,
  fetchPmProjectSummary,
  isPmTaskOverdue,
  mapPmProjectRow,
} from '@/lib/services/pm-service';
import { PM_PRIORITIES, PM_PROJECT_STATUSES, PM_STATUS_LABELS } from '@/lib/services/pm-types';
import { PmProgressBar } from '@/components/modules/project-management/PmProgressBar';
import { PmPersonCell } from '@/components/modules/project-management/PmPersonCell';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';

export function PmOverviewPage() {
  const router = useRouter();
  const { formatDate, formatCount } = useLocaleFormat();
  const apiStore = usePaginatedApiResource('pmProjects', mapPmProjectRow, { pageSize: 25 });
  const bootLoading = isKpiBootLoading(true, apiStore.initialized);
  const [summary, setSummary] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueTasks: 0,
  });
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    void fetchPmProjectSummary()
      .then((data) => setSummary(data))
      .catch(() => undefined);
  }, [apiStore.initialized, apiStore.rows]);

  useEffect(() => {
    void fetchResourceList(API_RESOURCE_PATHS.employees).then((rows) => {
      setManagers(
        rows.map((row) => ({
          id: String(row.id ?? row._id ?? ''),
          name: String(row.name ?? ''),
        })).filter((row) => row.id && row.name),
      );
    });
  }, []);

  const kpis = useMemo(
    () => [
      { key: 'total', label: 'Total Projects', value: formatCount(summary.totalProjects), sub: 'All your projects', iconify: 'flat-color-icons:folder' },
      { key: 'active', label: 'Active Projects', value: formatCount(summary.activeProjects), sub: 'Currently in progress', iconify: 'flat-color-icons:ok' },
      { key: 'completed', label: 'Completed', value: formatCount(summary.completedProjects), sub: 'Successfully finished', iconify: 'flat-color-icons:approval' },
      {
        key: 'overdue',
        label: 'Overdue Tasks',
        value: formatCount(summary.overdueTasks),
        sub: 'Require attention',
        alert: summary.overdueTasks > 0,
        iconify: 'flat-color-icons:high-priority',
      },
    ],
    [formatCount, summary],
  );

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Project Name',
      render: (row) => (
        <span className="inline-flex flex-col min-w-0">
          <span className="font-semibold text-slate-800 truncate">{String(row.name ?? '—')}</span>
          <span className="text-[10px] text-slate-400 font-medium truncate">{String(row.legacyId ?? '')}</span>
        </span>
      ),
    },
    {
      key: 'manager',
      label: 'Project Manager',
      render: (row) => <PmPersonCell name={String(row.managerName ?? '')} />,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (row) => (row.startDate ? formatDate(String(row.startDate)) : '—'),
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (row) => {
        const overdue = isPmTaskOverdue({ deadline: row.deadline, status: row.status === 'completed' ? 'completed' : 'todo' });
        return (
          <span className="inline-flex flex-col items-center">
            <span>{row.deadline ? formatDate(String(row.deadline)) : '—'}</span>
            {overdue ? <span className="text-[10px] font-bold text-rose-600">Overdue</span> : null}
          </span>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <StatusBadge status={PM_STATUS_LABELS[String(row.priority)] ?? String(row.priority)} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={PM_STATUS_LABELS[String(row.status)] ?? String(row.status)} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => <PmProgressBar value={Number(row.progress ?? 0)} />,
    },
    {
      key: 'tasks',
      label: 'Tasks',
      render: (row) => (
        <span className="tabular-nums text-slate-700 font-semibold">
          {Number(row.completedTaskCount ?? 0)} / {Number(row.taskCount ?? 0)}
        </span>
      ),
    },
  ], [formatDate]);

  const handleDelete = async (row: Record<string, unknown>) => {
    const id = resolveApiRowId(row);
    const ok = await confirmAction({
      title: 'Delete project',
      message: `Delete “${String(row.name ?? 'this project')}”? Tasks in this project will also be removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
      module: 'Projects',
    });
    if (!ok) return;
    const result = await deletePmProject(id);
    if (!result.ok) {
      toast.error('Could not delete project', { module: 'Projects', description: result.error });
      return;
    }
    toast.success('Project deleted', { module: 'Projects' });
    await apiStore.reload();
  };

  useRegisterModuleActions(
    <button type="button" className={CF_BTN_PRIMARY} onClick={() => router.push('/projects/new')}>
      <Plus className="w-4 h-4" /> Create Project
    </button>,
    [router],
  );

  return (
    <>
      <ApiModeBanner module="pmProjects" error={apiStore.error} />
      <ModuleKpiSection items={kpis} loading={bootLoading} gridClassName={getKpiGridClassName(4)} kpiCount={4} />
      <ModuleFilterBar
        search={apiStore.search}
        onSearchChange={apiStore.setSearchTerm}
        searchPlaceholder="Search projects by name..."
        filters={(
          <>
            <select
              className={MODULE_FILTER_INPUT}
              value={apiStore.status}
              onChange={(e) => apiStore.setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              {PM_PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>{PM_STATUS_LABELS[status]}</option>
              ))}
            </select>
            <select
              className={MODULE_FILTER_INPUT}
              value={apiStore.queryFilters.priority ?? 'all'}
              onChange={(e) => apiStore.setQueryFilter('priority', e.target.value)}
            >
              <option value="all">Priority: All</option>
              {PM_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{PM_STATUS_LABELS[priority]}</option>
              ))}
            </select>
            <select
              className={MODULE_FILTER_INPUT}
              value={apiStore.queryFilters.managerId ?? 'all'}
              onChange={(e) => apiStore.setQueryFilter('managerId', e.target.value)}
            >
              <option value="all">Manager: All</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>{manager.name}</option>
              ))}
            </select>
          </>
        )}
      />
      <div className="mt-4 premium-card overflow-hidden">
        <AppTable
          columns={columns}
          rows={apiStore.rows}
          loading={bootLoading || apiStore.loading}
          emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'projects')}
          onRowClick={(row) => router.push(`/projects/${resolveApiRowId(row)}`)}
          renderActions={(row) => (
            <>
              <TableIconAction variant="view" onClick={() => router.push(`/projects/${resolveApiRowId(row)}`)} />
              <TableIconAction variant="edit" onClick={() => router.push(`/projects/${resolveApiRowId(row)}/edit`)} />
              <TableIconAction variant="delete" onClick={() => void handleDelete(row)} />
            </>
          )}
        />
      </div>
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
