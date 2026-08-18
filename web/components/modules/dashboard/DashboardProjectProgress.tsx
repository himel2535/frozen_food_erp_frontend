'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { fetchResourcePage } from '@/lib/services/api-resource-service';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { mapPmProjectRow, pmProgressBarClass } from '@/lib/services/pm-service';
import { PM_STATUS_LABELS } from '@/lib/services/pm-types';

const PREVIEW_COUNT = 4;

export function DashboardProjectProgress() {
  const t = useAppStore((s) => s.t);
  const [expanded, setExpanded] = useState(false);
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    void fetchResourcePage(API_RESOURCE_PATHS.pmProjects, { page: 1, limit: 12, status: 'active' })
      .then((result) => setProjects(result.rows.map(mapPmProjectRow)))
      .catch(() => setProjects([]));
  }, []);

  const visibleProjects = useMemo(
    () => (expanded ? projects : projects.slice(0, PREVIEW_COUNT)),
    [expanded, projects],
  );
  const hasMore = projects.length > PREVIEW_COUNT;

  return (
    <section className="premium-card premium-shadow p-2.5 min-h-0 flex flex-col max-md:flex-none md:flex-[1.2_1_0%]">
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-2">
          <Icon icon="fluent-color:document-folder-24" width={22} height={22} className="shrink-0" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.project_progress')}</h3>
        </div>
        <div className="flex items-center gap-3">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {expanded ? t('dashboard.show_less') : t('dashboard.view_details')}
            </button>
          ) : null}
          <Link href="/projects" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            {t('dashboard.view_all')}
          </Link>
        </div>
      </div>

      {visibleProjects.length ? (
        <div className={`grid gap-2 flex-1 overflow-y-auto min-h-0 ${expanded ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {visibleProjects.map((project) => {
            const progress = Number(project.progress ?? 0);
            const href = `/projects/${String(project.id ?? '')}`;
            return (
              <Link
                key={String(project.id)}
                href={href}
                className="rounded-xl border border-slate-100 bg-white/80 p-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{String(project.name ?? '—')}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{String(project.managerName ?? '')}</p>
                  </div>
                  <span className="inline-flex shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200/60">
                    {PM_STATUS_LABELS[String(project.status)] ?? String(project.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 truncate">
                    {Number(project.completedTaskCount ?? 0)} / {Number(project.taskCount ?? 0)} tasks
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 tabular-nums shrink-0">{progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${pmProgressBarClass(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-xs font-medium text-slate-400 text-center py-8">{t('dashboard.no_active_projects')}</p>
      )}
    </section>
  );
}
