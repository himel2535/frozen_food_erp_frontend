'use client';

import { useMemo, useState } from 'react';
import { Layers, Package, Calculator } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards } from '@/components/shared/KpiCards';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { BomMaterialForm, type BomMaterialFormValues } from '@/components/modules/purchases/BomMaterialForm';
import { useAppStore } from '@/lib/state/app-store';
import {
  listRecipes,
  getRecipe,
  getRecipeMetrics,
  getRecipeBomCost,
  getRecipeBomTotals,
  listMaterialOptions,
  listFinishedProducts,
  listSupplierOptions,
  createRecipe,
  deleteRecipe,
  addMaterialToRecipe,
  updateMaterialInRecipe,
  removeMaterialFromRecipe,
  formatMoney,
  type Recipe,
  type BomMaterial,
} from '@/lib/services/recipes-service';

type View = 'main' | 'form' | 'bom';

const UNIT_OPTIONS = ['pcs', 'kg', 'liter', 'box', 'meter', 'set'];

function MaterialCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
        <Package className="w-4 h-4" />
      </span>
      <span className="font-semibold text-slate-800">{name}</span>
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
  const [newRecipeProductId, setNewRecipeProductId] = useState('');

  const recipes = useMemo(() => listRecipes(appState), [appState]);
  const materialOptions = useMemo(() => listMaterialOptions(appState), [appState]);
  const supplierOptions = useMemo(() => listSupplierOptions(appState), [appState]);
  const finishedProducts = useMemo(() => listFinishedProducts(appState), [appState]);

  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.productSku.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [recipes, search]);

  const metrics = useMemo(() => getRecipeMetrics(recipes), [recipes]);
  const activeRecipe = useMemo(
    () => (bomRecipeId ? getRecipe(appState, bomRecipeId) : null),
    [appState, bomRecipeId],
  );
  const bomTotals = useMemo(
    () => (activeRecipe ? getRecipeBomTotals(activeRecipe) : null),
    [activeRecipe],
  );

  const listColumns = useMemo<AppTableColumn<Recipe>[]>(
    () => [
      { key: 'id', label: 'Recipe #' },
      { key: 'productSku', label: 'Product SKU' },
      { key: 'product', label: 'Product' },
      {
        key: 'materials',
        label: 'Materials',
        render: (row) => String(row.materials.length),
      },
      {
        key: 'cost',
        label: 'Est. Cost',
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

  const bomColumns = useMemo<AppTableColumn<BomMaterial>[]>(
    () => [
      {
        key: 'index',
        label: '#',
        render: (_row, index) => index + 1,
      },
      {
        key: 'name',
        label: 'Material / Component',
        render: (row) => <MaterialCell name={row.name} />,
      },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      {
        key: 'qtyPerProduct',
        label: 'Qty per Product',
        render: (row) => row.qtyPerProduct.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      },
      {
        key: 'wastagePct',
        label: 'Wastage (%)',
        render: (row) => `${row.wastagePct}%`,
      },
      {
        key: 'effectiveQty',
        label: 'Effective Qty',
        render: (row) => (
          <span className="font-bold text-emerald-700">{row.effectiveQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        ),
      },
      {
        key: 'costPerProduct',
        label: 'Cost / Product (৳)',
        render: (row) => formatMoney(row.costPerProduct),
      },
      {
        key: 'totalCostImpact',
        label: 'Total Cost Impact (৳)',
        render: (row) => formatMoney(row.costPerProduct),
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

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setEditMaterialInitial(undefined);
    setMaterialFormKey((k) => k + 1);
  };

  const handleMaterialSubmit = (values: BomMaterialFormValues, mode: 'add' | 'addAnother') => {
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
    };

    const result = editingMaterialId
      ? updateMaterialInRecipe(appState, bomRecipeId, editingMaterialId, payload)
      : addMaterialToRecipe(appState, bomRecipeId, payload);

    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Failed to save material');
      return;
    }
    saveAppState();
    if (mode === 'add') resetMaterialForm();
    else {
      setEditingMaterialId(null);
      setEditMaterialInitial(undefined);
      setMaterialFormKey((k) => k + 1);
    }
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
    });
    setMaterialFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (!bomRecipeId || !window.confirm('Remove this material from the BOM?')) return;
    const result = removeMaterialFromRecipe(appState, bomRecipeId, materialId);
    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Failed to remove material');
      return;
    }
    saveAppState();
    if (editingMaterialId === materialId) resetMaterialForm();
  };

  const handleCreateRecipe = () => {
    const product = finishedProducts.find((p) => String(p.id) === newRecipeProductId);
    if (!product) {
      window.alert('Please select a product.');
      return;
    }
    const sku = String(product.sku ?? product.id);
    const result = createRecipe(appState, {
      productSku: sku,
      product: String(product.name),
      productId: product.id as string | number,
      status: 'active',
    });
    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Failed to create recipe');
      return;
    }
    saveAppState();
    openBom(result.id);
    setNewRecipeProductId('');
    setView('bom');
  };

  const handleDeleteRecipe = (id: string) => {
    if (!window.confirm('Delete this recipe and all BOM materials?')) return;
    deleteRecipe(appState, id);
    saveAppState();
  };

  const bomFooter =
    activeRecipe && bomTotals && activeRecipe.materials.length > 0 ? (
      <tr>
        <td colSpan={10} className="app-table-td !p-0 !border-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 border-t border-slate-200">
            <div className="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-200 px-4 py-3">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-slate-900">{bomTotals.totalMaterials}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Materials</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/80 border border-slate-200 px-4 py-3">
              <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-slate-900">
                  {bomTotals.totalEffective.toLocaleString(undefined, { maximumFractionDigits: 2 })} pcs
                </p>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Effective Components</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/80 border border-emerald-50 border-emerald-200 px-4 py-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold text-emerald-700">{formatMoney(bomTotals.estimatedCost)}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Estimated BOM Cost / Product</p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    ) : null;

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
        <div className="max-w-xl mx-auto w-full space-y-6">
          <FormHeader
            title="Add Recipe"
            subtitle="Link a finished product to a new bill of materials."
            onBack={() => setView('main')}
          />
          <div className="premium-card premium-shadow p-6 space-y-4">
            <div>
              <label className="block mb-2 text-xs font-bold text-slate-600">Finished Product</label>
              <select
                value={newRecipeProductId}
                onChange={(e) => setNewRecipeProductId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs cursor-pointer"
              >
                <option value="">Select product...</option>
                {finishedProducts.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {String(p.sku ?? p.id)} — {String(p.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setView('main')} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleCreateRecipe} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">
                Create &amp; Manage BOM
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (view === 'bom' && activeRecipe) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
        <div className="space-y-1">
          <FormHeader
            title={`${activeRecipe.productSku} — ${activeRecipe.product}`}
            subtitle={`Recipes (BOM) / ${activeRecipe.productSku} — ${activeRecipe.product}`}
            onBack={() => {
              setView('main');
              setBomRecipeId(null);
              resetMaterialForm();
            }}
          />
          <StatusBadge status={activeRecipe.status} />
        </div>

        <BomMaterialForm
          key={materialFormKey}
          materialOptions={materialOptions}
          supplierOptions={supplierOptions}
          unitOptions={UNIT_OPTIONS}
          editingMaterialId={editingMaterialId}
          initialValues={editMaterialInitial}
          onSubmit={handleMaterialSubmit}
          onCancel={resetMaterialForm}
        />

        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            Materials in {activeRecipe.productSku}
          </h3>
          <AppTable<BomMaterial>
            columns={bomColumns}
            rows={activeRecipe.materials}
            rowKey={(row) => row.id}
            emptyMessage="No materials in this BOM yet. Add your first material above."
            footer={bomFooter}
            renderActions={(row) => (
              <>
                <TableIconAction variant="edit" label="Edit material" onClick={() => handleEditMaterial(row)} />
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
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <ListToolbar
        title="Recipes (BOM)"
        subtitle="Bill of materials for purchased components."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product or recipe..."
        onAdd={() => setView('form')}
        addLabel="Add Recipe"
      />

      <KpiCards
        items={[
          { key: 'total', label: 'Total Recipes', value: String(metrics.total) },
          { key: 'active', label: 'Active', value: String(metrics.active) },
          { key: 'avg', label: 'Avg BOM Cost', value: formatMoney(metrics.avgCost) },
        ]}
      />

      <AppTable<Recipe>
        columns={listColumns}
        rows={filteredRecipes}
        rowKey={(row) => row.id}
        emptyMessage="No recipes found. Add a recipe to define a product BOM."
        renderActions={(row) => (
          <>
            <TableIconAction variant="edit" label="Manage BOM" onClick={() => openBom(row.id)} />
            <TableIconAction variant="delete" onClick={() => handleDeleteRecipe(row.id)} />
          </>
        )}
      />

      <Footer />
    </div>
  );
}
