'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { CF_BTN_GHOST } from '@/components/modules/crm/customer-form/customer-form-styles';
import { FORM_SELECT_CLS } from '@/lib/ui/form-styles';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { toast } from '@/lib/ui/feedback';
import { fetchMyPmTasks, isPmTaskOverdue, patchPmTaskStatus } from '@/lib/services/pm-service';
import { PM_STATUS_LABELS, PM_TASK_STATUSES } from '@/lib/services/pm-types';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';

type TaskGroups = {
  overdue: Record<string, unknown>[];
  today: Record<string, unknown>[];
  upcoming: Record<string, unknown>[];
  completed: Record<string, unknown>[];
};

const SECTION_META: Array<{
  key: keyof TaskGroups;
  title: string;
  accent: string;
}> = [
  { key: 'overdue', title: 'Overdue', accent: 'text-rose-700' },
  { key: 'today', title: 'Today', accent: 'text-amber-700' },
  { key: 'upcoming', title: 'Upcoming', accent: 'text-blue-700' },
  { key: 'completed', title: 'Completed', accent: 'text-emerald-700' },
];

export function PmMyTasksPage() {
  const router = useRouter();
  const { formatDate, formatCount } = useLocaleFormat();
  const [groups, setGroups] = useState<TaskGroups>({ overdue: [], today: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({ overdue: true, today: true, upcoming: true, completed: false });
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setGroups(await fetchMyPmTasks());
    } catch (err) {
      toast.error('Could not load tasks', {
        module: 'Projects',
        description: err instanceof Error ? err.message : 'Try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchMyPmTasks()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error('Could not load tasks', {
          module: 'Projects',
          description: err instanceof Error ? err.message : 'Try again.',
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(
    () => [
      { key: 'overdue', label: 'Overdue', value: formatCount(groups.overdue.length), sub: 'Tasks past deadline', alert: groups.overdue.length > 0, iconify: 'flat-color-icons:high-priority' },
      { key: 'today', label: 'Today', value: formatCount(groups.today.length), sub: 'Due today', iconify: 'flat-color-icons:calendar' },
      { key: 'upcoming', label: 'Upcoming', value: formatCount(groups.upcoming.length), sub: 'Future deadlines', iconify: 'flat-color-icons:planner' },
      { key: 'completed', label: 'Completed', value: formatCount(groups.completed.length), sub: 'Finished tasks', iconify: 'flat-color-icons:ok' },
    ],
    [formatCount, groups],
  );

  const handleStatus = async (row: Record<string, unknown>, status: string) => {
    const id = resolveApiRowId(row);
    if (!id || savingId || status === String(row.status)) return;
    setSavingId(id);
    try {
      await patchPmTaskStatus(id, status);
      toast.success('Status updated', { module: 'Projects' });
      await reload();
    } catch (err) {
      toast.error('Could not update status', {
        module: 'Projects',
        description: err instanceof Error ? err.message : 'Try again.',
      });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <PageSkeleton variant="module-list" label="Loading my tasks" />;

  return (
    <>
      <ModuleKpiSection items={kpis} gridClassName={getKpiGridClassName(4)} kpiCount={4} />
      <div className="space-y-3 mt-2">
        {SECTION_META.map((section) => {
          const rows = groups[section.key];
          const expanded = open[section.key] !== false;
          return (
            <section key={section.key} className="premium-card premium-shadow overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setOpen((prev) => ({ ...prev, [section.key]: !expanded }))}
              >
                <span className={`text-sm font-extrabold ${section.accent}`}>
                  {section.title} ({rows.length})
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded ? (
                rows.length === 0 ? (
                  <p className="px-4 pb-4 text-xs text-slate-400">No tasks in this section.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-t border-slate-100">
                          <th className="px-4 py-2 font-bold">Task</th>
                          <th className="px-4 py-2 font-bold">Project</th>
                          <th className="px-4 py-2 font-bold">Deadline</th>
                          <th className="px-4 py-2 font-bold">Priority</th>
                          <th className="px-4 py-2 font-bold">Status</th>
                          <th className="px-4 py-2 font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const overdue = isPmTaskOverdue(row);
                          return (
                            <tr key={resolveApiRowId(row)} className="border-t border-slate-50">
                              <td className="px-4 py-2.5 font-semibold text-slate-800">{String(row.name ?? '—')}</td>
                              <td className="px-4 py-2.5 text-slate-600">{String(row.projectName ?? '—')}</td>
                              <td className={`px-4 py-2.5 ${overdue ? 'text-rose-600 font-semibold' : 'text-slate-700'}`}>
                                {row.deadline ? formatDate(String(row.deadline)) : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={PM_STATUS_LABELS[String(row.priority)] ?? String(row.priority)} />
                              </td>
                              <td className="px-4 py-2.5">
                                <select
                                  className={FORM_SELECT_CLS}
                                  value={String(row.status)}
                                  disabled={savingId === resolveApiRowId(row)}
                                  onChange={(e) => void handleStatus(row, e.target.value)}
                                >
                                  {PM_TASK_STATUSES.map((status) => (
                                    <option key={status} value={status}>{PM_STATUS_LABELS[status]}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2.5">
                                <button
                                  type="button"
                                  className={CF_BTN_GHOST}
                                  onClick={() => router.push(`/projects/tasks/${resolveApiRowId(row)}`)}
                                >
                                  Update
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : null}
            </section>
          );
        })}
      </div>
      <Footer />
    </>
  );
}
