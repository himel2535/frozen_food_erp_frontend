'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Package } from 'lucide-react';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { FormHeader } from '@/components/layout/FormHeader';
import { Footer } from '@/components/layout/Footer';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { ProjectFormStepper } from '@/components/modules/projects/project-form/ProjectFormStepper';
import { ProjectSetupProgress } from '@/components/modules/projects/project-form/ProjectSetupProgress';
import {
  PJ_BTN_GHOST,
  PJ_BTN_OUTLINE,
  PJ_BTN_PRIMARY,
} from '@/components/modules/projects/project-form/project-form-styles';
import { MODULE_SHELL_SUPPRESSED } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { fetchResourceById, updateResource } from '@/lib/services/api-resource-service';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';
import {
  advanceProjectSetup,
  formatProjectMoney,
  getProjectById,
  projectSetupLabel,
} from '@/lib/services/projects-service';
import { resolveRecipeForInventoryRow } from '@/lib/services/recipes-service';

type ProjectRow = Record<string, unknown>;
type ProjectItem = {
  productId?: string;
  productName?: string;
  qty?: number;
  unitPrice?: number;
  lineTotal?: number;
};

function projectItems(project: ProjectRow): ProjectItem[] {
  return Array.isArray(project.items) ? project.items as ProjectItem[] : [];
}

export function ProjectSetupPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('projects');
  const recipeStore = useApiResourceStore('recipes', mapGenericApiRow, { pageOnly: true, lookupLimit: 200 });
  const [apiProject, setApiProject] = useState<ProjectRow | null>(null);
  const [apiLoading, setApiLoading] = useState(apiMode && Boolean(projectId));

  useEffect(() => {
    if (!apiMode || !projectId) return;
    setApiLoading(true);
    void fetchResourceById(API_RESOURCE_PATHS.projects, projectId).then((doc) => {
      setApiProject(doc ? mapGenericApiRow(doc) as ProjectRow : null);
      setApiLoading(false);
    });
  }, [apiMode, projectId]);

  useChromeSuppressed(true);

  const activeStep = Math.min(4, Math.max(2, Number(searchParams.get('step') ?? 2)));

  const projectState = useMemo(() => {
    if (!apiMode) return appState;
    return {
      ...appState,
      projects: apiProject ? [apiProject] : [],
      recipes: recipeStore.initialized ? recipeStore.rows : appState.recipes ?? [],
    };
  }, [apiMode, apiProject, recipeStore.initialized, recipeStore.rows, appState]);

  const project = useMemo(
    () => (apiMode ? apiProject : getProjectById(projectState, projectId)),
    [apiMode, apiProject, projectState, projectId],
  );

  const items = useMemo(() => (project ? projectItems(project) : []), [project]);

  const recipeLinks = useMemo(() => {
    return items.map((item) => {
      const productId = String(item.productId ?? '');
      const recipe = productId
        ? resolveRecipeForInventoryRow(projectState, { id: productId, sku: productId })
        : null;
      return { item, recipe, productId };
    });
  }, [items, projectState]);

  const bomReady = recipeLinks.some((row) => row.recipe && (row.recipe.materials?.length ?? 0) > 0);
  const allBomReady = recipeLinks.length > 0 && recipeLinks.every((row) => row.recipe && (row.recipe.materials?.length ?? 0) > 0);

  const persistStep = async (nextStep: number, patch: Record<string, unknown> = {}) => {
    if (!project) return false;
    const rowId = String(project.id);

    if (apiMode) {
      const pseudo = {
        ...projectState,
        projects: apiProject ? [{ ...apiProject }] : [],
      };
      const result = advanceProjectSetup(pseudo as typeof appState, rowId, nextStep, patch);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Projects', description: String(result.error ?? 'Update failed') });
        return false;
      }
      const updated = getProjectById(pseudo as typeof appState, rowId);
      if (!updated) return false;
      const sync = await updateResource(
        API_RESOURCE_PATHS.projects,
        resolveApiRowId(project),
        mapGenericPayloadToApi(updated as Record<string, unknown>),
      );
      if (!sync.ok) {
        toast.error('Operation failed', { module: 'Projects', description: 'error' in sync ? String(sync.error) : 'Sync failed' });
        return false;
      }
      setApiProject(updated as ProjectRow);
      return true;
    }

    const result = advanceProjectSetup(appState, rowId, nextStep, patch);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Projects', description: String(result.error ?? 'Update failed') });
      return false;
    }
    saveAppState();
    return true;
  };

  const goToStep = async (nextStep: number, patch?: Record<string, unknown>) => {
    const ok = await persistStep(nextStep, patch);
    if (!ok) return;
    router.push(`/projects/${projectId}/setup?step=${nextStep}`);
  };

  const startProduction = async () => {
    if (!allBomReady) {
      toast.error('Complete setup', { module: 'Projects', description: 'Finish BOM setup before starting production.' });
      return;
    }
    const ok = await persistStep(4, { status: 'active', productionStartedAt: new Date().toISOString() });
    if (!ok) return;
    toast.success('Production started', { module: 'Projects', description: 'Project is now active in the pipeline.' });
    router.push('/projects');
  };

  if (apiMode && (apiLoading || !recipeStore.initialized)) {
    return <PageSkeleton variant="module-list" label="Loading project setup" />;
  }

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

  const projectName = String(project.name ?? project.projectId ?? 'Project');
  const totalValue = Number(project.totalValue ?? project.budget ?? 0);

  return (
    <div className={`${MODULE_SHELL_SUPPRESSED} pb-4`}>
      <div className="pt-3 md:pt-4 mb-2">
        <FormHeader
          compact
          title={projectName}
          subtitle={`Step ${activeStep}: ${projectSetupLabel(activeStep)}`}
          onBack={() => router.push('/projects')}
          backLabel="Back to Projects"
        />
      </div>

      <ProjectFormStepper activeStep={activeStep} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-3">
        <div className="premium-card premium-shadow p-4 space-y-4">
          {activeStep === 2 ? (
            <>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">BOM / Recipe Setup</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Link a recipe (BOM) for each product in this project order.
                </p>
              </div>
              <div className="space-y-2">
                {recipeLinks.map(({ item, recipe, productId }, index) => {
                  const materialCount = recipe?.materials?.length ?? 0;
                  const ready = materialCount > 0;
                  return (
                    <div key={`${productId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{String(item.productName ?? 'Product')}</p>
                        <p className="text-[10px] text-slate-500">{Number(item.qty ?? 0).toLocaleString()} pcs · {formatProjectMoney(Number(item.lineTotal ?? 0))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${ready ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {ready ? `${materialCount} materials` : 'No BOM yet'}
                        </span>
                        <Link
                          href={`/purchases/recipes/finished-goods${productId ? `?focusProduct=${encodeURIComponent(productId)}` : ''}`}
                          className={`${PJ_BTN_OUTLINE} !py-1.5 !px-2.5 text-[10px]`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Setup BOM
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className={PJ_BTN_OUTLINE} onClick={() => router.push('/projects')}>
                  Save &amp; Exit
                </button>
                <button
                  type="button"
                  className={PJ_BTN_PRIMARY}
                  onClick={() => {
                    if (!bomReady) {
                      toast.error('BOM required', { module: 'Projects', description: 'Configure at least one product BOM before continuing.' });
                      return;
                    }
                    void goToStep(3);
                  }}
                >
                  Continue to Production Plan
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}

          {activeStep === 3 ? (
            <>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Production Plan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review linked recipes and confirm production readiness.
                </p>
              </div>
              <div className="space-y-2">
                {recipeLinks.map(({ item, recipe }, index) => (
                  <div key={index} className="rounded-xl border border-slate-100 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800">{String(item.productName ?? 'Product')}</p>
                        <p className="text-[10px] text-slate-500">
                          Recipe: {recipe?.recipeNumber ?? '—'} · Materials: {recipe?.materials?.length ?? 0}
                        </p>
                      </div>
                      {recipe ? (
                        <Link href={`/purchases/recipes/finished-goods`} className={`${PJ_BTN_OUTLINE} !py-1 !px-2 text-[10px]`}>
                          View BOM
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <button type="button" className={PJ_BTN_GHOST} onClick={() => router.push(`/projects/${projectId}/setup?step=2`)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  className={PJ_BTN_PRIMARY}
                  onClick={() => {
                    if (!allBomReady) {
                      toast.error('Complete BOM setup', { module: 'Projects', description: 'All products need a recipe with materials.' });
                      return;
                    }
                    void goToStep(4);
                  }}
                >
                  Continue to Review
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}

          {activeStep === 4 ? (
            <>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Review &amp; Start</h3>
                <p className="text-xs text-slate-500 mt-1">Confirm project details before starting production.</p>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><dt className="text-slate-500 font-semibold">Customer</dt><dd className="font-bold text-slate-800">{String(project.customerName ?? '—')}</dd></div>
                <div><dt className="text-slate-500 font-semibold">Lead</dt><dd className="font-bold text-slate-800">{String(project.lead ?? project.salesPersonName ?? '—')}</dd></div>
                <div><dt className="text-slate-500 font-semibold">Delivery</dt><dd className="font-bold text-slate-800">{String(project.expectedDeliveryDate ?? project.deadline ?? '—')}</dd></div>
                <div><dt className="text-slate-500 font-semibold">Order Value</dt><dd className="font-bold text-emerald-700">{formatProjectMoney(totalValue)}</dd></div>
                <div><dt className="text-slate-500 font-semibold">Products</dt><dd className="font-bold text-slate-800">{items.length} line items</dd></div>
                <div><dt className="text-slate-500 font-semibold">BOM Status</dt><dd className="font-bold text-slate-800">{allBomReady ? 'Ready' : 'Incomplete'}</dd></div>
              </dl>
              <div className="flex justify-between gap-2 pt-2">
                <button type="button" className={PJ_BTN_GHOST} onClick={() => router.push(`/projects/${projectId}/setup?step=3`)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  className={PJ_BTN_PRIMARY}
                  onClick={() => { void startProduction(); }}
                >
                  <Check className="w-4 h-4" />
                  Start Production
                </button>
              </div>
            </>
          ) : null}
        </div>

        <aside className="flex flex-col gap-3 xl:sticky xl:top-4 xl:self-start">
          <section className="premium-card premium-shadow p-3.5 space-y-2">
            <h4 className="text-sm font-extrabold text-slate-900">Project Summary</h4>
            <p className="text-xs font-bold text-slate-800">{projectName}</p>
            <p className="text-[11px] text-slate-500">{String(project.projectId ?? project.id ?? '')}</p>
            <p className="text-sm font-extrabold text-emerald-700">{formatProjectMoney(totalValue)}</p>
          </section>
          <ProjectSetupProgress activeStep={activeStep} />
        </aside>
      </div>

      <Footer />
    </div>
  );
}
