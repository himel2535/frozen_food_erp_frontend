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
import {
  fetchMyPmTasks,
  peekMyPmTasks,
  type MyPmTasksGroups,
  patchPmTaskStatus,
} from '@/lib/services/pm-service';
import { PM_STATUS_LABELS, PM_TASK_STATUSES } from '@/lib/services/pm-types';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';

const EMPTY_GROUPS: MyPmTasksGroups = {
  overdue: [],
  today: [],
  upcoming: [],
  completed: [],
};

const SECTION_META: Array<{
  key: keyof MyPmTasksGroups;
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
  const [groups, setGroups] = useState<MyPmTasksGroups>(() => peekMyPmTasks() ?? EMPTY_GROUPS);
  const [loading, setLoading] = useState(() => !peekMyPmTasks());
  const [open, setOpen] = useState<Record<string, boolean>>({ overdue: true, today: true, upcoming: true, completed: false });
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async (opts?: { force?: boolean; silent?: boolean }) => {
    if (!opts?.silent && !peekMyPmTasks()) setLoading(true);
    try {
      const data = await fetchMyPmTasks(opts?.force);
      setGroups(data);
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
    const cached = peekMyPmTasks();
    if (cached) {
      setGroups(cached);
      setLoading(false);
      void reload({ silent: true });
      return;
    }
    void reload();
  }, [reload]);

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
      await reload({ force: true, silent: true });
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
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${section.accent}`}>{section.title}</span>
                  <span className="text-xs text-slate-500">({rows.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded ? (
                rows.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-slate-500">No tasks in this section.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const id = resolveApiRowId(row);
                      return (
                        <li key={id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <button
                            type="button"
                            className="flex-1 text-left cursor-pointer"
                            onClick={() => router.push(`/projects/${String(row.projectId)}/tasks/${id}`)}
                          >
                            <p className="text-sm font-semibold text-slate-800">{String(row.name ?? 'Task')}</p>
                            <p className="text-xs text-slate-500">{String(row.projectName ?? 'Project')} · Due {formatDate(String(row.deadline ?? ''))}</p>
                          </button>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={String(row.status ?? 'todo')} />
                            <select
                              className={FORM_SELECT_CLS}
                              value={String(row.status ?? 'todo')}
                              disabled={savingId === id}
                              onChange={(e) => void handleStatus(row, e.target.value)}
                            >
                              {PM_TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>{PM_STATUS_LABELS[status] ?? status}</option>
                              ))}
                            </select>
                            <button type="button" className={CF_BTN_GHOST} onClick={() => router.push(`/projects/${String(row.projectId)}/tasks/${id}`)}>
                              Open
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
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
