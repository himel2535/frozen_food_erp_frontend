'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ArrowDown, ArrowUp, Calculator, Layers, Package, Paperclip } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { ListToolbar, ModuleToolbarActions } from '@/components/shared/ListToolbar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { BomMaterialForm, type BomMaterialFormValues } from '@/components/modules/purchases/BomMaterialForm';
import { PlanProductionModal } from '@/components/modules/purchases/PlanProductionModal';
import { RecipeCard } from '@/components/modules/purchases/RecipeCard';
import { RecipesBomMetrics } from '@/components/modules/purchases/RecipesBomMetrics';
import { RecipeProductionPlanView } from '@/components/modules/purchases/RecipeProductionPlanView';
import { useAppStore } from '@/lib/state/app-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { isModuleApiMode } from '@/lib/config/data-source';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';
import type { AppState } from '@/lib/state/types';
import type { PortField } from '@/lib/modules/port-types';
import {
  listRecipesForVariant,
  getRecipe,
  getRecipeBomKpiMetrics,
  getRecipeBomCost,
  getRecipeBomTotals,
  listMaterialOptions,
  listSupplierOptions,
  createRecipe,
  deleteRecipe,
  addMaterialToRecipe,
  updateMaterialInRecipe,
  removeMaterialFromRecipe,
  reorderMaterialInRecipe,
  formatMoney,
  mapRecipeToApi,
  resolveRecipeForInventoryRow,
  type Recipe,
  type BomMaterial,
} from '@/lib/services/recipes-service';

type View = 'main' | 'form' | 'bom' | 'plan';
type RecipeListLayout = 'cards' | 'table';
type RecipeVariant = 'finished-goods' | 'semi-finished';

const VARIANT_CONFIG: Record<RecipeVariant, {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyMessage: string;
  breadcrumb: string;
  layoutKey: string;
}> = {
  'finished-goods': {
    title: 'Finished Goods BOM',
    subtitle: 'Create a recipe first, then build the bill of materials for each finished product.',
    searchPlaceholder: 'Search finished product, model, or recipe...',
    emptyMessage: 'No finished goods BOM found. Click Create Recipe to start.',
    breadcrumb: 'Finished Goods BOM',
    layoutKey: 'recipes-list-layout-finished',
  },
  'semi-finished': {
    title: 'Semi-Finished BOM',
    subtitle: 'Create a recipe first, then build the parts list for each semi-finished product.',
    searchPlaceholder: 'Search semi-finished product, model, or recipe...',
    emptyMessage: 'No semi-finished BOM found. Click Create Recipe to start.',
    breadcrumb: 'Semi-Finished BOM',
    layoutKey: 'recipes-list-layout-semi-finished',
  },
};

const UNIT_OPTIONS = ['pcs', 'kg', 'liter', 'box', 'meter', 'set'];

const RECIPE_CREATE_FIELDS: PortField[] = [
  { key: 'product', label: 'Product Name', required: true, placeholder: 'e.g. Kids Toy Car' },
  { key: 'model', label: 'Model', required: true, placeholder: 'e.g. T101' },
  { key: 'recipeNumber', label: 'Recipe Number', placeholder: 'Auto-generated if blank (RCP-001)' },
];

const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10';

function cloneRecipeState(state: AppState): AppState {
  const cloneRows = (rows: Record<string, unknown>[] | undefined) =>
    (rows ?? []).map((row) => ({
      ...row,
      materials: Array.isArray(row.materials)
        ? (row.materials as Record<string, unknown>[]).map((material) => ({ ...material }))
        : [],
    }));

  return {
    ...state,
    finishedGoodsRecipes: cloneRows(state.finishedGoodsRecipes as Record<string, unknown>[] | undefined),
    semiFinishedRecipes: cloneRows(state.semiFinishedRecipes as Record<string, unknown>[] | undefined),
  } as AppState;
}

function resolveRecipeApiId(rows: Record<string, unknown>[], recipeId: string): string {
  const match = rows.find(
    (row) => String(row.id) === recipeId
      || String(row.legacyId) === recipeId
      || String(row.recipeNumber) === recipeId,
  );
  return match ? resolveApiRowId(match) : recipeId;
}

function MaterialCell({ name, attachmentName, attachmentDataUrl }: { name: string; attachmentName?: string; attachmentDataUrl?: string }) {
  const isImage = attachmentDataUrl && (attachmentDataUrl.startsWith('data:image') || attachmentDataUrl.startsWith('http'));

  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachmentDataUrl}
          alt={attachmentName || name}
          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
        />
      ) : (
        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="font-semibold text-slate-800 block">{name}</span>
        {attachmentName && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 mt-0.5">
            <Paperclip className="w-3 h-3" /> {attachmentName}
          </span>
        )}
      </span>
    </div>
  );
}

function BomSummaryStrip({
  totals,
}: {
  totals: { totalMaterials: number; totalEffective: number; estimatedCost: number };
}) {
  return (
    <div className="flex flex-wrap gap-2 shrink-0 xl:justify-end self-start">
      <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-slate-200 px-2.5 py-2 w-[168px]">
        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Layers className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 leading-tight">{totals.totalMaterials}</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">Total Materials</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-slate-200 px-2.5 py-2 w-[168px]">
        <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
          <Package className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 leading-tight truncate">
            {totals.totalEffective.toLocaleString(undefined, { maximumFractionDigits: 2 })} pcs
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">Total Effective Components</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white/80 border border-emerald-200 px-2.5 py-2 w-[168px]">
        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Calculator className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-emerald-700 leading-tight truncate">{formatMoney(totals.estimatedCost)}</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">Est. BOM Cost / Product</p>
        </div>
      </div>
    </div>
  );
}

export function RecipesPage({ variant = 'finished-goods' }: { variant?: RecipeVariant }) {
  const appState = useAppStore((s) => s.appState);
  const apiDataReady = useAppStore((s) => s.apiDataReady);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('recipes');
  const apiStore = usePaginatedApiResource('recipes', mapGenericApiRow, { pageSize: 25 });
  const searchParams = useSearchParams();
  const config = VARIANT_CONFIG[variant];

  const [view, setView] = useState<View>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [bomRecipeId, setBomRecipeId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialFormKey, setMaterialFormKey] = useState(0);
  const [editMaterialInitial, setEditMaterialInitial] = useState<Partial<BomMaterialFormValues> | undefined>();
  const [newRecipe, setNewRecipe] = useState({ product: '', model: '', recipeNumber: '' });
  const [planRecipeId, setPlanRecipeId] = useState<string | null>(null);
  const [planBatchQty, setPlanBatchQty] = useState(1);
  const [planQtyInput, setPlanQtyInput] = useState('');
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [listLayout, setListLayout] = useState<RecipeListLayout>(() => {
    if (typeof window === 'undefined') return 'cards';
    const saved = window.localStorage.getItem(config.layoutKey);
    return saved === 'table' ? 'table' : 'cards';
  });

  const setListLayoutPersisted = (layout: RecipeListLayout) => {
    setListLayout(layout);
    window.localStorage.setItem(config.layoutKey, layout);
  };

  const recipeState = useMemo((): AppState => {
    if (!apiMode) return appState;
    const fg = apiStore.rows.filter((r) => String(r.variant ?? 'finished-goods') === 'finished-goods');
    const sf = apiStore.rows.filter((r) => String(r.variant) === 'semi-finished');
    return { ...appState, finishedGoodsRecipes: fg, semiFinishedRecipes: sf } as AppState;
  }, [apiMode, apiStore.rows, appState]);

  const recipes = useMemo(
    () => listRecipesForVariant(recipeState, variant),
    [recipeState, variant],
  );
  const materialOptions = useMemo(() => listMaterialOptions(recipeState), [recipeState]);
  const supplierOptions = useMemo(() => listSupplierOptions(recipeState), [recipeState]);

  const filteredRecipes = useMemo(() => {
    const q = apiMode ? '' : localSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.recipeNumber.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [recipes, apiMode, apiStore.search, localSearch]);

  const bomKpiMetrics = useMemo(() => getRecipeBomKpiMetrics(recipes), [recipes]);
  const activeRecipe = useMemo(
    () => (bomRecipeId ? getRecipe(recipeState, bomRecipeId) : null),
    [recipeState, bomRecipeId],
  );
  const planRecipe = useMemo(
    () => (planRecipeId ? getRecipe(recipeState, planRecipeId) : null),
    [recipeState, planRecipeId],
  );
  const bomTotals = useMemo(
    () => (activeRecipe ? getRecipeBomTotals(activeRecipe) : null),
    [activeRecipe],
  );

  const bomColumns = useMemo<AppTableColumn<BomMaterial>[]>(
    () => [
      { key: 'index', label: '#', render: (_row, index) => index + 1 },
      { key: 'name', label: 'Material / Component', render: (row) => <MaterialCell name={row.name} attachmentName={row.attachmentName} attachmentDataUrl={row.attachmentDataUrl} /> },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'qtyPerProduct', label: 'Qty per Product', render: (row) => row.qtyPerProduct.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
      { key: 'effectiveQty', label: 'Effective Qty', render: (row) => <span className="font-bold text-emerald-700">{row.effectiveQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> },
      { key: 'costPerProduct', label: 'Cost / Product (৳)', render: (row) => formatMoney(row.costPerProduct) },
      { key: 'totalCostImpact', label: 'Total Cost Impact (৳)', render: (row) => formatMoney(row.costPerProduct) },
    ],
    [],
  );

  const recipeListColumns = useMemo<AppTableColumn<Recipe>[]>(
    () => [
      { key: 'product', label: 'Product', render: (row) => <span className="font-semibold text-slate-800">{row.product}</span> },
      {
        key: 'model',
        label: 'Model',
        render: (row) => (
          <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
            {row.model}
          </span>
        ),
      },
      { key: 'recipeNumber', label: 'Recipe #' },
      { key: 'version', label: 'Version' },
      {
        key: 'materials',
        label: 'Materials',
        render: (row) => `${row.materials.length} item${row.materials.length === 1 ? '' : 's'}`,
      },
      {
        key: 'bomCost',
        label: 'Est. Cost / Product',
        render: (row) => formatMoney(getRecipeBomCost(row)),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  const openBom = (recipeId: string) => {
    setBomRecipeId(recipeId);
    setEditingMaterialId(null);
    setEditMaterialInitial(undefined);
    setMaterialFormKey((k) => k + 1);
    setView('bom');
  };

  useEffect(() => {
    const recipeParam = searchParams.get('recipe');
    if (recipeParam) {
      const match = recipes.find(
        (recipe) => recipe.id === recipeParam || recipe.recipeNumber === recipeParam,
      );
      if (match) openBom(match.id);
      return;
    }
    const productParam = searchParams.get('product');
    if (!productParam) return;
    const linked = resolveRecipeForInventoryRow(recipeState, {
      id: productParam,
      sku: productParam,
      name: productParam,
    });
    if (linked && recipes.some((recipe) => recipe.id === linked.id)) {
      openBom(linked.id);
    } else {
      const invRow = recipeState.inventory?.find(
        (p) => String(p.id) === productParam || String(p.sku) === productParam || String(p.name) === productParam
      );
      setNewRecipe({
        product: String(invRow?.name ?? productParam),
        model: String(invRow?.sku ?? invRow?.id ?? productParam),
        recipeNumber: '',
      });
      setView('form');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, recipes, recipeState.inventory]);

  const openPlanInput = (recipeId: string) => {
    const recipe = getRecipe(recipeState, recipeId);
    if (!recipe || recipe.materials.length === 0) return;
    setPlanRecipeId(recipeId);
    setPlanQtyInput('');
    setPlanModalOpen(true);
  };

  const resetPlanState = () => {
    setPlanRecipeId(null);
    setPlanBatchQty(1);
    setPlanQtyInput('');
    setPlanModalOpen(false);
  };

  const backToMain = () => {
    setView('main');
    resetPlanState();
  };

  const handlePlanSubmit = (qty: number) => {
    setPlanBatchQty(qty);
    setPlanModalOpen(false);
    setView('plan');
  };

  const planModal = (
    <PlanProductionModal
      open={planModalOpen}
      recipe={planRecipe}
      initialQty={planQtyInput}
      onClose={() => setPlanModalOpen(false)}
      onSubmit={handlePlanSubmit}
    />
  );

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setEditMaterialInitial(undefined);
    setMaterialFormKey((k) => k + 1);
  };

  const syncRecipeToApi = async (recipeId: string, sourceState: AppState) => {
    const updated = getRecipe(sourceState, recipeId);
    if (!updated) return { ok: false as const, error: 'Recipe not found' };
    const apiId = resolveRecipeApiId(apiStore.rows, recipeId);
    return apiStore.update(apiId, mapRecipeToApi(updated, variant));
  };

  const handleMaterialSubmit = async (values: BomMaterialFormValues) => {
    if (!bomRecipeId) return;
    const payload = {
      materialId: values.materialId || `custom-${Date.now()}`,
      name: values.name,
      category: values.category,
      unit: values.unit,
      qtyPerProduct: values.qtyPerProduct,
      wastagePct: values.wastagePct,
      standardCost: values.standardCost,
      preferredSupplier: values.preferredSupplier || undefined,
      remarks: values.remarks || undefined,
      attachmentName: values.attachmentName,
      attachmentDataUrl: values.attachmentDataUrl,
    };

    if (apiMode) {
      const pseudo = cloneRecipeState(recipeState);
      const result = editingMaterialId
        ? updateMaterialInRecipe(pseudo, bomRecipeId, editingMaterialId, payload)
        : addMaterialToRecipe(pseudo, bomRecipeId, payload);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to save material' });
        return;
      }
      const sync = await syncRecipeToApi(bomRecipeId, pseudo);
      if (!sync.ok) {
        toast.error('Operation failed', { module: 'Recipes', description: 'error' in sync ? String(sync.error) : 'Sync failed' });
        return;
      }
      toast.success('Material saved', { module: 'Recipes', description: editingMaterialId ? 'BOM material updated.' : 'Material added to BOM.' });
      resetMaterialForm();
      return;
    }

    const result = editingMaterialId
      ? updateMaterialInRecipe(appState, bomRecipeId, editingMaterialId, payload)
      : addMaterialToRecipe(appState, bomRecipeId, payload);

    if (!result.ok) {
      toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to save material' });
      return;
    }
    saveAppState();
    resetMaterialForm();
  };

  const handleEditMaterial = (material: BomMaterial) => {
    setEditingMaterialId(material.id);
    setEditMaterialInitial({
      materialId: material.materialId,
      name: material.name,
      category: material.category,
      unit: material.unit,
      qtyPerProduct: material.qtyPerProduct,
      wastagePct: material.wastagePct,
      standardCost: material.standardCost,
      preferredSupplier: material.preferredSupplier ?? '',
      remarks: material.remarks ?? '',
      attachmentName: material.attachmentName,
      attachmentDataUrl: material.attachmentDataUrl,
    });
    setMaterialFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!bomRecipeId) return;
    const ok = await confirmAction({
      title: 'Remove material',
      message: 'Remove this material from the BOM?',
      confirmLabel: 'Remove',
      tone: 'danger',
      module: 'Recipes',
    });
    if (!ok) return;
    if (apiMode) {
      const pseudo = cloneRecipeState(recipeState);
      const result = removeMaterialFromRecipe(pseudo, bomRecipeId, materialId);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to remove material' });
        return;
      }
      const sync = await syncRecipeToApi(bomRecipeId, pseudo);
      if (!sync.ok) {
        toast.error('Operation failed', { module: 'Recipes', description: 'error' in sync ? String(sync.error) : 'Sync failed' });
        return;
      }
      toast.success('Material removed', { module: 'Recipes' });
      if (editingMaterialId === materialId) resetMaterialForm();
      return;
    }
    const result = removeMaterialFromRecipe(appState, bomRecipeId, materialId);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to remove material' });
      return;
    }
    saveAppState();
    if (editingMaterialId === materialId) resetMaterialForm();
  };

  const handleReorder = async (materialId: string, direction: 'up' | 'down') => {
    if (!bomRecipeId) return;
    if (apiMode) {
      const pseudo = cloneRecipeState(recipeState);
      reorderMaterialInRecipe(pseudo, bomRecipeId, materialId, direction);
      await syncRecipeToApi(bomRecipeId, pseudo);
      return;
    }
    reorderMaterialInRecipe(appState, bomRecipeId, materialId, direction);
    saveAppState();
  };

  const handleCreateRecipe = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (apiMode) {
      const result = await apiStore.create(mapGenericPayloadToApi({
        product: newRecipe.product,
        model: newRecipe.model,
        recipeNumber: newRecipe.recipeNumber || undefined,
        status: 'active',
        variant,
        materials: [],
      }));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to create recipe' });
        return;
      }
      toast.success('Recipe created', { module: 'Recipes' });
      setNewRecipe({ product: '', model: '', recipeNumber: '' });
      setView('main');
      return;
    }
    const result = createRecipe(appState, {
      product: newRecipe.product,
      model: newRecipe.model,
      recipeNumber: newRecipe.recipeNumber || undefined,
      status: 'active',
    }, variant);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to create recipe' });
      return;
    }
    saveAppState();
    setNewRecipe({ product: '', model: '', recipeNumber: '' });
    setView('main');
  };

  const handleDeleteRecipe = async (id: string) => {
    const __ok = await confirmAction({ title: "Delete this recipe and all BOM materials", message: "Delete this recipe and all BOM materials?", confirmLabel: 'Delete', tone: 'danger', module: 'Recipes' }); if (!__ok) return;
    if (apiMode) {
      await apiStore.remove(resolveRecipeApiId(apiStore.rows, id));
      toast.success('Recipe deleted', { module: 'Recipes' });
      return;
    }
    deleteRecipe(appState, id);
    saveAppState();
  };

  useChromeSuppressed(view !== 'main');

  const handleCreateRecipeClick = () => {
    const productParam = searchParams.get('product');
    if (productParam) {
      const invRow = recipeState.inventory?.find(
        (p) => String(p.id) === productParam || String(p.sku) === productParam || String(p.name) === productParam
      );
      setNewRecipe({
        product: String(invRow?.name ?? productParam),
        model: String(invRow?.sku ?? invRow?.id ?? productParam),
        recipeNumber: '',
      });
    } else {
      setNewRecipe({ product: '', model: '', recipeNumber: '' });
    }
    setView('form');
  };

  useRegisterModuleActions(
    view === 'main' ? (
      <ModuleToolbarActions onAdd={handleCreateRecipeClick} addLabel="Create Recipe" />
    ) : null,
    [view, searchParams, recipeState.inventory],
  );

  if (apiMode && !apiDataReady && !apiStore.initialized) {
    return <PageSkeleton variant="module-list" label="Loading recipes" />;
  }

  if (view === 'plan' && planRecipe) {
    return (
      <>
        <RecipeProductionPlanView
          recipe={planRecipe}
          batchQty={planBatchQty}
          appState={recipeState}
          onBack={backToMain}
          onEditQty={() => {
            setPlanQtyInput(String(planBatchQty));
            setPlanModalOpen(true);
          }}
        />
        {planModal}
      </>
    );
  }


  if (view === 'bom' && activeRecipe) {
    const bomCost = getRecipeBomCost(activeRecipe);
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">
              {config.breadcrumb} &gt; {activeRecipe.model} - {activeRecipe.product} &gt; Add Material
            </p>
            <div className="flex flex-wrap items-center gap-3 [&>div]:mb-0">
              <FormHeader
                title={`${activeRecipe.model} - ${activeRecipe.product}`}
                subtitle={`BOM ${activeRecipe.version} • ${activeRecipe.materials.length} Materials • Est. Cost: ${formatMoney(bomCost)} / product`}
                onBack={() => {
                  setView('main');
                  setBomRecipeId(null);
                  resetMaterialForm();
                }}
              />
              <StatusBadge status={activeRecipe.status} />
            </div>
          </div>

          {bomTotals && activeRecipe.materials.length > 0 && <BomSummaryStrip totals={bomTotals} />}
        </div>

        <BomMaterialForm
          key={materialFormKey}
          appState={recipeState}
          materialOptions={materialOptions}
          supplierOptions={supplierOptions}
          unitOptions={UNIT_OPTIONS}
          editingMaterialId={editingMaterialId}
          initialValues={editMaterialInitial}
          onSubmit={handleMaterialSubmit}
          onCancel={resetMaterialForm}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Materials in {activeRecipe.model} - {activeRecipe.product} ({activeRecipe.materials.length} items)
            </h3>
            <span className="text-xs font-bold text-slate-500">Use row arrows to reorder materials</span>
          </div>
          <AppTable<BomMaterial>
            columns={bomColumns}
            rows={activeRecipe.materials}
            rowKey={(row) => row.id}
            emptyMessage="No materials in this BOM yet. Add your first material above."
            renderActions={(row, index) => (
              <>
                <TableIconAction variant="edit" label="Edit material" onClick={() => handleEditMaterial(row)} />
                <button
                  type="button"
                  onClick={() => handleReorder(row.id, 'up')}
                  disabled={index === 0}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Move up"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(row.id, 'down')}
                  disabled={index === activeRecipe.materials.length - 1}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Move down"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <TableIconAction variant="delete" onClick={() => handleDeleteMaterial(row.id)} />
              </>
            )}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      {apiStore.error ? <ApiModeBanner module="recipes" error={apiStore.error} /> : null}
      <RecipesBomMetrics variant={variant} metrics={bomKpiMetrics} />

      <ListToolbar
        search={apiMode ? apiStore.search : localSearch}
        onSearchChange={(v) => {
          if (apiMode) apiStore.setSearchTerm(v);
          else setLocalSearch(v);
        }}
        searchPlaceholder={config.searchPlaceholder}
        filters={
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setListLayoutPersisted('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                listLayout === 'cards' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
              aria-pressed={listLayout === 'cards'}
            >
              <Icon icon="flat-color-icons:grid" width={22} height={22} className="shrink-0" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setListLayoutPersisted('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                listLayout === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
              aria-pressed={listLayout === 'table'}
            >
              <Icon icon="flat-color-icons:list" width={22} height={22} className="shrink-0" />
              Table
            </button>
          </div>
        }
      />

      {filteredRecipes.length === 0 ? (
        <div className="premium-card premium-shadow p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">{config.emptyMessage}</p>
        </div>
      ) : listLayout === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onCreateBom={() => openBom(recipe.id)}
              onPlanProduction={() => openPlanInput(recipe.id)}
              onDelete={() => handleDeleteRecipe(recipe.id)}
            />
          ))}
        </div>
      ) : (
        <AppTable<Recipe>
          columns={recipeListColumns}
          rows={filteredRecipes}
          rowKey={(row) => row.id}
          emptyMessage={config.emptyMessage}
          renderActions={(row) => (
            <>
              <Button
                type="button"
                onClick={() => openBom(row.id)}
                variant="primary"
                size="sm"
                className="!px-2.5 !py-1.5 !text-[11px]"
              >
                {row.materials.length > 0 ? 'Manage BOM' : 'Create BOM'}
              </Button>
              <button
                type="button"
                onClick={() => openPlanInput(row.id)}
                disabled={row.materials.length === 0}
                title={row.materials.length > 0 ? 'Calculate materials for a batch' : 'Add BOM materials first'}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800 text-[11px] font-bold cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Plan Production
              </button>
              <TableIconAction variant="delete" label="Delete recipe" onClick={() => handleDeleteRecipe(row.id)} />
            </>
          )}
        />
      )}

      {apiMode ? (
        <ListPagination
          page={apiStore.page}
          pageSize={apiStore.pageSize}
          total={apiStore.meta.total}
          onPageChange={apiStore.setPage}
        />
      ) : null}

      <Footer />
    <AppFormModal
      open={view === 'form'}
      onClose={() => setView('main')}
      title="Create Recipe"
      subtitle="Phase 1 — enter product name, model, and recipe number only."
      onSubmit={handleCreateRecipe}
      submitLabel="Save Recipe"
      size="sm"
    >
      <AppFormFields
        fields={RECIPE_CREATE_FIELDS}
        values={newRecipe}
        onChange={(key, value) => setNewRecipe((p) => ({ ...p, [key]: value }))}
        columns={1}
      />
    </AppFormModal>
    {planModal}
    </>
  );
}
