'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ListPagination } from '@/components/shared/ListPagination';
import { CF_BTN_GHOST, CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { FORM_CARD_CLS } from '@/lib/ui/form-styles';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { confirmAction, toast } from '@/lib/ui/feedback';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { fetchResourceById } from '@/lib/services/api-resource-service';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';
import {
  deletePmTask,
  isPmTaskOverdue,
  mapPmProjectRow,
  mapPmTaskRow,
} from '@/lib/services/pm-service';
import { PM_PRIORITIES, PM_STATUS_LABELS, PM_TASK_STATUSES } from '@/lib/services/pm-types';
import { PmPersonCell } from '@/components/modules/project-management/PmPersonCell';
import { PmProgressBar } from '@/components/modules/project-management/PmProgressBar';

export function PmProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  useChromeSuppressed(true);
  const { formatDate, formatCount } = useLocaleFormat();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const taskStore = usePaginatedApiResource('pmTasks', mapPmTaskRow, { pageSize: 25 });

  const { setQueryFilter } = taskStore;

  useEffect(() => {
    setQueryFilter('projectId', projectId);
  }, [projectId, setQueryFilter]);

  useEffect(() => {
    let cancelled = false;
    void fetchResourceById(API_RESOURCE_PATHS.pmProjects, projectId).then((doc) => {
      if (cancelled) return;
      setProject(doc ? mapPmProjectRow(doc) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, taskStore.rows]);

  const kpis = useMemo(() => {
    const total = Number(project?.taskCount ?? 0);
    const completed = Number(project?.completedTaskCount ?? 0);
    const overdue = taskStore.rows.filter((row) => isPmTaskOverdue(row)).length;
    const pending = Math.max(0, total - completed);
    return [
      { key: 'total', label: 'Total Tasks', value: formatCount(total), iconify: 'flat-color-icons:todo-list' },
      { key: 'completed', label: 'Completed', value: formatCount(completed), iconify: 'flat-color-icons:ok' },
      { key: 'pending', label: 'Pending', value: formatCount(pending), iconify: 'flat-color-icons:clock' },
      { key: 'overdue', label: 'Overdue', value: formatCount(overdue), alert: overdue > 0, iconify: 'flat-color-icons:high-priority' },
    ];
  }, [formatCount, project, taskStore.rows]);

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'name',
      label: 'Task',
      render: (row) => <span className="font-semibold text-slate-800">{String(row.name ?? '—')}</span>,
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row) => <PmPersonCell name={String(row.assignedToName ?? '')} />,
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
        const overdue = isPmTaskOverdue(row);
        return (
          <span className={overdue ? 'text-rose-600 font-semibold' : ''}>
            {row.deadline ? formatDate(String(row.deadline)) : '—'}
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
  ], [formatDate]);

  const handleDelete = async (row: Record<string, unknown>) => {
    const ok = await confirmAction({
      title: 'Delete task',
      message: `Delete “${String(row.name ?? 'this task')}”?`,
      confirmLabel: 'Delete',
      tone: 'danger',
      module: 'Projects',
    });
    if (!ok) return;
    const result = await deletePmTask(resolveApiRowId(row));
    if (!result.ok) {
      toast.error('Could not delete task', { module: 'Projects', description: result.error });
      return;
    }
    toast.success('Task deleted', { module: 'Projects' });
    await taskStore.reload();
  };

  if (loading) return <PageSkeleton variant="detail" label="Loading project" />;
  if (!project) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Project not found.{' '}
        <button type="button" onClick={() => router.push('/projects')} className="text-blue-600 font-bold cursor-pointer">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <ChildPageShell
      title={String(project.name ?? 'Project')}
      subtitle={String(project.description ?? '') || 'Project details and tasks'}
      onBack={() => router.push('/projects')}
      backLabel="Back to Projects"
      actions={(
        <>
          <button type="button" className={CF_BTN_GHOST} onClick={() => router.push(`/projects/${projectId}/edit`)}>
            <Pencil className="w-4 h-4" /> Edit Project
          </button>
          <button type="button" className={CF_BTN_PRIMARY} onClick={() => router.push(`/projects/${projectId}/tasks/new`)}>
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </>
      )}
    >
      <div className={`${FORM_CARD_CLS} !space-y-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={PM_STATUS_LABELS[String(project.status)] ?? String(project.status)} />
          <StatusBadge status={PM_STATUS_LABELS[String(project.priority)] ?? String(project.priority)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Project Manager</p>
            <div className="mt-1"><PmPersonCell name={String(project.managerName ?? '')} /></div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Start Date</p>
            <p className="mt-1 font-semibold text-slate-800">{project.startDate ? formatDate(String(project.startDate)) : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Deadline</p>
            <p className="mt-1 font-semibold text-slate-800">{project.deadline ? formatDate(String(project.deadline)) : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Progress</p>
            <div className="mt-2"><PmProgressBar value={Number(project.progress ?? 0)} /></div>
          </div>
        </div>
      </div>

      <ModuleKpiSection items={kpis} gridClassName={getKpiGridClassName(4)} kpiCount={4} />

      <ModuleFilterBar
        search={taskStore.search}
        onSearchChange={taskStore.setSearchTerm}
        searchPlaceholder="Search tasks..."
        filters={(
          <>
            <select className={MODULE_FILTER_INPUT} value={taskStore.status} onChange={(e) => taskStore.setStatusFilter(e.target.value)}>
              <option value="all">Status: All</option>
              {PM_TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{PM_STATUS_LABELS[status]}</option>
              ))}
            </select>
            <select
              className={MODULE_FILTER_INPUT}
              value={taskStore.queryFilters.priority ?? 'all'}
              onChange={(e) => taskStore.setQueryFilter('priority', e.target.value)}
            >
              <option value="all">Priority: All</option>
              {PM_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{PM_STATUS_LABELS[priority]}</option>
              ))}
            </select>
          </>
        )}
      />

      <div className="premium-card overflow-hidden">
        <AppTable
          columns={columns}
          rows={taskStore.rows}
          loading={taskStore.loading && !taskStore.initialized}
          emptyMessage={apiListEmptyMessage(taskStore.loading, taskStore.initialized, 'tasks')}
          onRowClick={(row) => router.push(`/projects/tasks/${resolveApiRowId(row)}`)}
          renderActions={(row) => (
            <>
              <TableIconAction variant="edit" onClick={() => router.push(`/projects/tasks/${resolveApiRowId(row)}/edit`)} />
              <TableIconAction variant="delete" onClick={() => void handleDelete(row)} />
            </>
          )}
        />
      </div>
      <ListPagination
        page={taskStore.page}
        pageSize={taskStore.pageSize}
        total={taskStore.meta.total}
        onPageChange={taskStore.setPage}
      />
      <Footer />
    </ChildPageShell>
  );
}
