'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator, Package, Plus } from 'lucide-react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import {
  calcEffectiveQty,
  calcCostPerProduct,
  type MaterialOption,
} from '@/lib/services/recipes-service';
import { formatMoney } from '@/lib/services/recipes-service';

export type BomMaterialFormValues = {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  qtyPerProduct: number;
  wastagePct: number;
  standardCost: number;
  preferredSupplier: string;
  remarks: string;
};

const EMPTY_FORM: BomMaterialFormValues = {
  materialId: '',
  name: '',
  category: '',
  unit: 'pcs',
  qtyPerProduct: 1,
  wastagePct: 0,
  standardCost: 0,
  preferredSupplier: '',
  remarks: '',
};

const INPUT_CLS =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`;
const LABEL_CLS = 'block mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide';

interface BomMaterialFormProps {
  materialOptions: MaterialOption[];
  supplierOptions: { id: string; name: string }[];
  unitOptions: string[];
  editingMaterialId: string | null;
  initialValues?: Partial<BomMaterialFormValues>;
  onSubmit: (values: BomMaterialFormValues, mode: 'add' | 'addAnother') => void;
  onCancel: () => void;
}

export function BomMaterialForm({
  materialOptions,
  supplierOptions,
  unitOptions,
  editingMaterialId,
  initialValues,
  onSubmit,
  onCancel,
}: BomMaterialFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [form, setForm] = useState<BomMaterialFormValues>({ ...EMPTY_FORM, ...initialValues });

  useEffect(() => {
    if (initialValues) {
      setForm({ ...EMPTY_FORM, ...initialValues });
      setMaterialSearch(initialValues.name ?? '');
    }
  }, [initialValues, editingMaterialId]);

  const effectiveQty = useMemo(
    () => Number(calcEffectiveQty(form.qtyPerProduct, form.wastagePct).toFixed(2)),
    [form.qtyPerProduct, form.wastagePct],
  );

  const filteredMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    if (!q) return materialOptions.slice(0, 12);
    return materialOptions.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }, [materialOptions, materialSearch]);

  const selectedMaterial = materialOptions.find((m) => m.id === form.materialId);

  const pickMaterial = (option: MaterialOption) => {
    setForm((prev) => ({
      ...prev,
      materialId: option.id,
      name: option.name,
      category: option.category,
      unit: option.unit,
      standardCost: option.standardCost,
    }));
    setMaterialSearch(option.name);
  };

  const handleSubmit = (mode: 'add' | 'addAnother') => {
    if (!form.name.trim()) {
      window.alert('Please select or enter a material.');
      return;
    }
    if (form.qtyPerProduct <= 0) {
      window.alert('Qty per product must be greater than zero.');
      return;
    }
    onSubmit(form, mode);
    if (mode === 'addAnother') {
      setForm({ ...EMPTY_FORM, unit: form.unit });
      setMaterialSearch('');
      setShowAdvanced(false);
    }
  };

  return (
    <div className="premium-card premium-shadow p-5 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            {editingMaterialId ? 'Edit Material in BOM' : 'Add Material to BOM'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Search and select a material from inventory or create new one.
          </p>
        </div>
        <Link
          href="/inventory/raw-materials"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Material
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <label className={LABEL_CLS}>Material / Component</label>
              <input
                type="search"
                value={materialSearch || form.name}
                onChange={(e) => {
                  setMaterialSearch(e.target.value);
                  if (!e.target.value) setForm((p) => ({ ...p, materialId: '', name: '' }));
                }}
                placeholder="Search material name or code..."
                className={INPUT_CLS}
              />
              {materialSearch && !selectedMaterial && filteredMaterials.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {filteredMaterials.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => pickMaterial(m)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 truncate">{m.name}</span>
                        <span className="block text-[10px] text-slate-500 font-semibold">
                          {m.category} · {m.code} · {m.availability} avail · {formatMoney(m.standardCost)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {selectedMaterial && (
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  {selectedMaterial.category} · {selectedMaterial.code} · {selectedMaterial.availability} in stock · Last price {formatMoney(selectedMaterial.standardCost)}
                </p>
              )}
            </div>

            <div>
              <label className={LABEL_CLS}>Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                className={SELECT_CLS}
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLS}>Qty per Product</label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={form.qtyPerProduct}
                onChange={(e) => setForm((p) => ({ ...p, qtyPerProduct: Number(e.target.value) || 0 }))}
                className={INPUT_CLS}
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Quantity used for 1 finished product.</p>
            </div>

            <div>
              <label className={LABEL_CLS}>Wastage (%)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.wastagePct}
                onChange={(e) => setForm((p) => ({ ...p, wastagePct: Number(e.target.value) || 0 }))}
                className={INPUT_CLS}
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Expected loss in production.</p>
            </div>
          </div>

          <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className={LABEL_CLS}>Standard Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.standardCost}
                    onChange={(e) => setForm((p) => ({ ...p, standardCost: Number(e.target.value) || 0 }))}
                    className={`${INPUT_CLS} pl-8`}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLS}>Preferred Supplier</label>
                <select
                  value={form.preferredSupplier}
                  onChange={(e) => setForm((p) => ({ ...p, preferredSupplier: e.target.value }))}
                  className={SELECT_CLS}
                >
                  <option value="">Select supplier</option>
                  {supplierOptions.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLS}>Remarks (Optional)</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                  className={INPUT_CLS}
                  placeholder="Optional notes for this material line"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 space-y-2 h-fit">
          <div className="flex items-center gap-2 text-emerald-700">
            <Calculator className="w-4 h-4" />
            <span className="text-xs font-extrabold uppercase tracking-wide">Effective Requirement</span>
          </div>
          <p className="text-lg font-extrabold text-emerald-800">
            {effectiveQty} {form.unit}
            <span className="text-xs font-semibold text-emerald-600 block mt-0.5">per finished product</span>
          </p>
          <p className="text-xs font-semibold text-emerald-700">
            For 100 products, <span className="font-extrabold">{(effectiveQty * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} {form.unit}</span> required.
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold pt-1 border-t border-emerald-100">
            Est. cost / product: {formatMoney(calcCostPerProduct(effectiveQty, form.standardCost))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('addAnother')}
          className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
        >
          Save &amp; Add Another
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('add')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {editingMaterialId ? 'Update Material' : 'Add Material'}
        </button>
      </div>
    </div>
  );
}

export { EMPTY_FORM as BOM_MATERIAL_EMPTY_FORM };
