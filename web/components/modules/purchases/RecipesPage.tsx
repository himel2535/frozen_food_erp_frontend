'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { ArrowDown, ArrowUp, Calculator, Layers, Package, Paperclip } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { BomMaterialForm, type BomMaterialFormValues } from '@/components/modules/purchases/BomMaterialForm';
import { PlanProductionModal } from '@/components/modules/purchases/PlanProductionModal';
import { RecipeCard } from '@/components/modules/purchases/RecipeCard';
import { RecipeProductionPlanView } from '@/components/modules/purchases/RecipeProductionPlanView';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import {
  listRecipes,
  getRecipe,
  getRecipeMetrics,
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
  type Recipe,
  type BomMaterial,
} from '@/lib/services/recipes-service';

type View = 'main' | 'form' | 'bom' | 'plan';
type RecipeListLayout = 'cards' | 'table';

const RECIPES_LAYOUT_KEY = 'recipes-list-layout';

const UNIT_OPTIONS = ['pcs', 'kg', 'liter', 'box', 'meter', 'set'];

const RECIPE_CREATE_FIELDS: PortField[] = [
  { key: 'product', label: 'Product Name', required: true, placeholder: 'e.g. Kids Toy Car' },
  { key: 'model', label: 'Model', required: true, placeholder: 'e.g. T101' },
  { key: 'recipeNumber', label: 'Recipe Number', placeholder: 'Auto-generated if blank (RCP-001)' },
];

const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10';

function MaterialCell({ name, attachmentName }: { name: string; attachmentName?: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
        <Package className="w-4 h-4" />
      </span>
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

export function RecipesPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const [view, setView] = useState<View>('main');
  const [search, setSearch] = useState('');
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
    const saved = window.localStorage.getItem(RECIPES_LAYOUT_KEY);
    return saved === 'table' ? 'table' : 'cards';
  });

  const setListLayoutPersisted = (layout: RecipeListLayout) => {
    setListLayout(layout);
    window.localStorage.setItem(RECIPES_LAYOUT_KEY, layout);
  };

  const recipes = useMemo(() => listRecipes(appState), [appState]);
  const materialOptions = useMemo(() => listMaterialOptions(appState), [appState]);
  const supplierOptions = useMemo(() => listSupplierOptions(appState), [appState]);

  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.recipeNumber.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [recipes, search]);

  const metrics = useMemo(() => getRecipeMetrics(recipes), [recipes]);
  const activeRecipe = useMemo(
    () => (bomRecipeId ? getRecipe(appState, bomRecipeId) : null),
    [appState, bomRecipeId],
  );
  const planRecipe = useMemo(
    () => (planRecipeId ? getRecipe(appState, planRecipeId) : null),
    [appState, planRecipeId],
  );
  const bomTotals = useMemo(
    () => (activeRecipe ? getRecipeBomTotals(activeRecipe) : null),
    [activeRecipe],
  );

  const bomColumns = useMemo<AppTableColumn<BomMaterial>[]>(
    () => [
      { key: 'index', label: '#', render: (_row, index) => index + 1 },
      { key: 'name', label: 'Material / Component', render: (row) => <MaterialCell name={row.name} attachmentName={row.attachmentName} /> },
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

  const openPlanInput = (recipeId: string) => {
    const recipe = getRecipe(appState, recipeId);
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

  const handleMaterialSubmit = (values: BomMaterialFormValues) => {
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
    const result = removeMaterialFromRecipe(appState, bomRecipeId, materialId);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Recipes', description: 'error' in result ? String(result.error) : 'Failed to remove material' });
      return;
    }
    saveAppState();
    if (editingMaterialId === materialId) resetMaterialForm();
  };

  const handleReorder = (materialId: string, direction: 'up' | 'down') => {
    if (!bomRecipeId) return;
    reorderMaterialInRecipe(appState, bomRecipeId, materialId, direction);
    saveAppState();
  };

  const handleCreateRecipe = (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = createRecipe(appState, {
      product: newRecipe.product,
      model: newRecipe.model,
      recipeNumber: newRecipe.recipeNumber || undefined,
      status: 'active',
    });
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
    deleteRecipe(appState, id);
    saveAppState();
  };

  if (view === 'plan' && planRecipe) {
    return (
      <>
        <RecipeProductionPlanView
          recipe={planRecipe}
          batchQty={planBatchQty}
          appState={appState}
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
              Recipes (BOM) &gt; {activeRecipe.model} - {activeRecipe.product} &gt; Add Material
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
          appState={appState}
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
    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 flex flex-col">
      <ListToolbar
        title="Recipes (BOM)"
        subtitle="Create a recipe first, then build the bill of materials for each product."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product, model, or recipe..."
        onAdd={() => setView('form')}
        addLabel="Create Recipe"
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

      <section className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 hover:shadow-md min-h-[72px]">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Total Recipes</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight">{metrics.total}</span>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <Icon icon="flat-color-icons:serial-tasks" width={38} height={38} className="shrink-0" />
          </div>
        </div>
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 hover:shadow-md min-h-[72px]">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Active</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight">{metrics.active}</span>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <Icon icon="fluent-color:checkmark-circle-24" width={38} height={38} className="shrink-0" />
          </div>
        </div>
        <div className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 hover:shadow-md min-h-[72px] col-span-2 md:col-span-1">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 tracking-wide block">Avg BOM Cost</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight truncate">{formatMoney(metrics.avgCost)}</span>
          </div>
          <div className="flex items-center justify-center shrink-0">
            <Icon icon="flat-color-icons:currency-exchange" width={38} height={38} className="shrink-0" />
          </div>
        </div>
      </section>

      {filteredRecipes.length === 0 ? (
        <div className="premium-card premium-shadow p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">No recipes found. Click Create Recipe to start.</p>
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
          emptyMessage="No recipes found. Click Create Recipe to start."
          renderActions={(row) => (
            <>
              <button
                type="button"
                onClick={() => openBom(row.id)}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
              >
                {row.materials.length > 0 ? 'Manage BOM' : 'Create BOM'}
              </button>
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

      <Footer />
    </div>
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
