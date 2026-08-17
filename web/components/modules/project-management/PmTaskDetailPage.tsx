'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { ChildPageShell } from '@/components/layout/ChildPageShell';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { CF_BTN_GHOST, CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { FORM_CARD_CLS, FORM_SELECT_CLS } from '@/lib/ui/form-styles';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { toast } from '@/lib/ui/feedback';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { fetchResourceById } from '@/lib/services/api-resource-service';
import { isPmTaskOverdue, mapPmTaskRow, patchPmTaskStatus } from '@/lib/services/pm-service';
import { PM_STATUS_LABELS, PM_TASK_STATUSES } from '@/lib/services/pm-types';
import { PmPersonCell } from '@/components/modules/project-management/PmPersonCell';

export function PmTaskDetailPage({ taskId }: { taskId: string }) {
  const router = useRouter();
  useChromeSuppressed(true);
  const { formatDate, formatDateTime } = useLocaleFormat();
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  const reload = useCallback(async () => {
    const doc = await fetchResourceById(API_RESOURCE_PATHS.pmTasks, taskId);
    setTask(doc ? mapPmTaskRow(doc) : null);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    let cancelled = false;
    void fetchResourceById(API_RESOURCE_PATHS.pmTasks, taskId).then((doc) => {
      if (cancelled) return;
      setTask(doc ? mapPmTaskRow(doc) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const handleStatus = async (status: string) => {
    if (!task || savingStatus || status === String(task.status)) return;
    setSavingStatus(true);
    try {
      await patchPmTaskStatus(taskId, status);
      toast.success('Status updated', { module: 'Projects' });
      reload();
    } catch (err) {
      toast.error('Could not update status', {
        module: 'Projects',
        description: err instanceof Error ? err.message : 'Try again.',
      });
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) return <PageSkeleton variant="detail" label="Loading task" />;
  if (!task) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Task not found.{' '}
        <button type="button" onClick={() => router.push('/projects')} className="text-blue-600 font-bold cursor-pointer">
          Back to Projects
        </button>
      </div>
    );
  }

  const projectId = String(task.projectId ?? '');
  const overdue = isPmTaskOverdue(task);
  const activity = Array.isArray(task.activity) ? (task.activity as Array<Record<string, unknown>>) : [];

  return (
    <ChildPageShell
      title={String(task.name ?? 'Task')}
      subtitle={String(task.projectName ?? 'Task details')}
      onBack={() => router.push(projectId ? `/projects/${projectId}` : '/projects')}
      backLabel="Back to Project"
      actions={(
        <button type="button" className={CF_BTN_GHOST} onClick={() => router.push(`/projects/tasks/${taskId}/edit`)}>
          <Pencil className="w-4 h-4" /> Edit Task
        </button>
      )}
    >
      <div className={`${FORM_CARD_CLS} !space-y-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={PM_STATUS_LABELS[String(task.status)] ?? String(task.status)} />
          <StatusBadge status={PM_STATUS_LABELS[String(task.priority)] ?? String(task.priority)} />
          {overdue ? <StatusBadge status="Overdue" /> : null}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Project</p>
            <p className="mt-1 font-semibold text-slate-800">{String(task.projectName ?? '—')}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Assigned To</p>
            <div className="mt-1"><PmPersonCell name={String(task.assignedToName ?? '')} /></div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Deadline</p>
            <p className={`mt-1 font-semibold ${overdue ? 'text-rose-600' : 'text-slate-800'}`}>
              {task.deadline ? formatDate(String(task.deadline)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Start Date</p>
            <p className="mt-1 font-semibold text-slate-800">{task.startDate ? formatDate(String(task.startDate)) : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</p>
            <select
              className={`${FORM_SELECT_CLS} mt-1`}
              value={String(task.status)}
              disabled={savingStatus}
              onChange={(e) => void handleStatus(e.target.value)}
            >
              {PM_TASK_STATUSES.map((status) => (
                <option key={status} value={status}>{PM_STATUS_LABELS[status]}</option>
              ))}
            </select>
          </div>
        </div>
        {task.description ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{String(task.description)}</p>
          </div>
        ) : null}
        {task.attachmentUrl ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Attachment</p>
            <a href={String(task.attachmentUrl)} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">
              {String(task.attachmentName || 'View attachment')}
            </a>
          </div>
        ) : null}
      </div>

      <div className={`${FORM_CARD_CLS} !space-y-3`}>
        <h3 className="text-sm font-extrabold text-slate-900">Activity</h3>
        {activity.length === 0 ? (
          <p className="text-xs text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activity.slice().reverse().map((item, index) => (
              <li key={`${item.at ?? index}-${index}`} className="text-xs">
                <p className="font-semibold text-slate-800">{String(item.message ?? '')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {[item.userName, item.at ? formatDateTime(String(item.at)) : ''].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {String(task.status) !== 'completed' ? (
        <div>
          <button
            type="button"
            className={CF_BTN_PRIMARY}
            disabled={savingStatus}
            onClick={() => void handleStatus('completed')}
          >
            Mark as Completed
          </button>
        </div>
      ) : null}
      <Footer />
    </ChildPageShell>
  );
}
