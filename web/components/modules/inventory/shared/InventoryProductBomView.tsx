'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Calculator, Layers, Package, Paperclip } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { InventoryEditActions } from '@/components/modules/inventory/shared/inventory-ui';
import { BomMaterialForm, type BomMaterialFormValues } from '@/components/modules/purchases/BomMaterialForm';
import type { AppState } from '@/lib/state/types';
import {
  addMaterialToRecipe,
  ensureFinishedGoodRecipe,
  ensureSemiFinishedRecipe,
  formatMoney,
  getRecipe,
  getRecipeBomCost,
  getRecipeBomTotals,
  listMaterialOptions,
  listSupplierOptions,
  removeMaterialFromRecipe,
  reorderMaterialInRecipe,
  updateMaterialInRecipe,
  type BomMaterial,
} from '@/lib/services/recipes-service';

const UNIT_OPTIONS = ['pcs', 'kg', 'liter', 'box', 'meter', 'set'];

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
        {attachmentName ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 mt-0.5">
            <Paperclip className="w-3 h-3" /> {attachmentName}
          </span>
        ) : null}
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

export function InventoryProductBomView({
  variant,
  row,
  appState,
  onBack,
  onSave,
}: {
  variant: 'finished-goods' | 'semi-finished';
  row: Record<string, unknown>;
  appState: AppState;
  onBack: () => void;
  onSave: () => void;
}) {
  const { canEdit, guardEdit } = useInventoryEditAccess();
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialFormKey, setMaterialFormKey] = useState(0);
  const [editMaterialInitial, setEditMaterialInitial] = useState<Partial<BomMaterialFormValues> | undefined>();
  const [ready, setReady] = useState(false);

  const productId = String(row.id ?? '');
  const productName = String(row.name ?? productId);

  useEffect(() => {
    const result = variant === 'finished-goods'
      ? ensureFinishedGoodRecipe(appState, {
          id: row.id as string | number,
          sku: String(row.sku ?? row.id ?? ''),
          name: productName,
          recipeId: row.recipeId as string | number | undefined,
        })
      : ensureSemiFinishedRecipe(appState, {
          id: row.id as string | number,
          name: productName,
          recipeId: row.recipeId as string | number | undefined,
        });
    if (!result.ok) {
      toast.error('BOM setup failed', { module: 'Inventory', description: result.error });
      setReady(true);
      return;
    }
    setRecipeId(result.recipeId);
    if (result.stateChanged) onSave();
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const materialOptions = useMemo(() => listMaterialOptions(appState), [appState]);
  const supplierOptions = useMemo(() => listSupplierOptions(appState), [appState]);

  const activeRecipe = useMemo(
    () => (recipeId ? getRecipe(appState, recipeId) : null),
    [appState, recipeId],
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
      { key: 'qtyPerProduct', label: 'Qty per Product', render: (r) => r.qtyPerProduct.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
      { key: 'wastagePct', label: 'Wastage %', render: (r) => `${r.wastagePct}%` },
      { key: 'standardCost', label: 'Unit Cost (৳)', render: (r) => formatMoney(r.standardCost) },
      { key: 'costPerProduct', label: 'Cost / Product (৳)', render: (r) => formatMoney(r.costPerProduct) },
    ],
    [],
  );

  const resetMaterialForm = () => {
    setEditingMaterialId(null);
    setEditMaterialInitial(undefined);
    setMaterialFormKey((k) => k + 1);
  };

  const handleMaterialSubmit = (values: BomMaterialFormValues) => {
    if (!guardEdit()) return;
    if (!recipeId) return;
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
      ? updateMaterialInRecipe(appState, recipeId, editingMaterialId, payload)
      : addMaterialToRecipe(appState, recipeId, payload);

    if (!result.ok) {
      toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Failed to save material' });
      return;
    }
    onSave();
    resetMaterialForm();
  };

  const handleEditMaterial = (material: BomMaterial) => {
    if (!guardEdit()) return;
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
    if (!guardEdit()) return;
    if (!recipeId) return;
    const ok = await confirmAction({
      title: 'Remove material',
      message: 'Remove this material from the BOM?',
      confirmLabel: 'Remove',
      tone: 'danger',
      module: 'Inventory',
    });
    if (!ok) return;
    const result = removeMaterialFromRecipe(appState, recipeId, materialId);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Failed to remove material' });
      return;
    }
    onSave();
    if (editingMaterialId === materialId) resetMaterialForm();
  };

  const handleReorder = (materialId: string, direction: 'up' | 'down') => {
    if (!guardEdit()) return;
    if (!recipeId) return;
    reorderMaterialInRecipe(appState, recipeId, materialId, direction);
    onSave();
  };

  if (!ready) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
        <p className="text-sm text-slate-500">Loading BOM...</p>
        <Footer />
      </div>
    );
  }

  if (!activeRecipe) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
        <FormHeader
          title={productName}
          subtitle="Could not load or create BOM for this product."
          onBack={onBack}
        />
        <Footer />
      </div>
    );
  }

  const bomCost = getRecipeBomCost(activeRecipe);
  const variantLabel = variant === 'semi-finished' ? 'Semi-Finished BOM' : 'Finished Goods BOM';

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500">
            {variantLabel} &gt; {productId} - {productName}
          </p>
          <div className="flex flex-wrap items-center gap-3 [&>div]:mb-0">
            <FormHeader
              title={`${productId} - ${productName}`}
              subtitle={`BOM ${activeRecipe.version} • ${activeRecipe.materials.length} Materials • Est. Cost: ${formatMoney(bomCost)} / product`}
              onBack={onBack}
            />
            <StatusBadge status={activeRecipe.status} />
          </div>
        </div>

        {bomTotals && activeRecipe.materials.length > 0 ? <BomSummaryStrip totals={bomTotals} /> : null}
      </div>

      {canEdit ? (
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
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            Parts in {productId} - {productName} ({activeRecipe.materials.length} items)
          </h3>
          {canEdit ? (
            <span className="text-xs font-bold text-slate-500">Use row arrows to reorder materials</span>
          ) : null}
        </div>
        <AppTable<BomMaterial>
          columns={bomColumns}
          rows={activeRecipe.materials}
          rowKey={(r) => r.id}
          emptyMessage="No parts in this BOM yet. Add your first material above."
          renderActions={(r, index) => (
            <InventoryEditActions canEdit={canEdit}>
              <TableIconAction variant="edit" label="Edit material" onClick={() => handleEditMaterial(r)} />
              <button
                type="button"
                onClick={() => handleReorder(r.id, 'up')}
                disabled={index === 0}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Move up"
                title="Move up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleReorder(r.id, 'down')}
                disabled={index === activeRecipe.materials.length - 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Move down"
                title="Move down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <TableIconAction variant="delete" onClick={() => handleDeleteMaterial(r.id)} />
            </InventoryEditActions>
          )}
        />
      </div>
      <Footer />
    </div>
  );
}
