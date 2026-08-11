'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useDashboardAppState } from '@/hooks/use-dashboard-api-data';
import {
  getDashboardProjectRows,
  projectHealthClass,
  projectProgressBarClass,
} from '@/lib/services/projects-service';

const PREVIEW_COUNT = 2;

export function DashboardProjectProgress() {
  const appState = useDashboardAppState();
  const t = useAppStore((s) => s.t);
  const [expanded, setExpanded] = useState(false);

  const allProjects = useMemo(() => getDashboardProjectRows(appState, 12), [appState]);
  const visibleProjects = expanded ? allProjects : allProjects.slice(0, PREVIEW_COUNT);
  const hasMore = allProjects.length > PREVIEW_COUNT;

  return (
    <section className="premium-card premium-shadow p-4">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
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
        <div className={`grid gap-3 ${expanded ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          {visibleProjects.map((project) => (
            <Link
              key={project.id}
              href="/projects"
              className="rounded-xl border border-slate-100 bg-white/80 p-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{project.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{project.lead}</p>
                </div>
                <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${projectHealthClass(project.health)}`}>
                  {project.health}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-semibold text-slate-500 truncate">{project.setupLabel}</span>
                <span className="text-xs font-extrabold text-slate-800 tabular-nums shrink-0">{project.progress}%</span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${projectProgressBarClass(project.health, project.progress)}`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                {t('dashboard.project_deadline')}: {project.deadline}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs font-medium text-slate-400 text-center py-8">{t('dashboard.no_active_projects')}</p>
      )}
    </section>
  );
}
