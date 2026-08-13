'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Calculator, CloudUpload, Package, Plus, Search, X } from 'lucide-react';
import { BomMaterialInsight } from '@/components/modules/purchases/BomMaterialInsight';
import {
  calcEffectiveQty,
  calcCostPerProduct,
  getMaterialInsight,
  formatMoney,
  type MaterialOption,
} from '@/lib/services/recipes-service';
import type { AppState } from '@/lib/state/types';

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
  attachmentName?: string;
  attachmentDataUrl?: string;
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
  'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`;
const UNIT_SELECT_CLS = `${SELECT_CLS} pr-7`;
const LABEL_CLS = 'block mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide';

function numberInputValue(n: number) {
  return n === 0 ? '' : n;
}

function parseNumberInput(raw: string) {
  if (raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function BomFieldLabel({
  children,
  required,
  optional,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className={LABEL_CLS}>
      {children}
      {required ? <span className="text-rose-500 normal-case tracking-normal"> *</span> : null}
      {optional ? (
        <span className="text-slate-400 font-semibold normal-case tracking-normal lowercase"> (optional)</span>
      ) : null}
    </label>
  );
}

interface BomMaterialFormProps {
  appState: AppState;
  materialOptions: MaterialOption[];
  supplierOptions: { id: string; name: string }[];
  unitOptions: string[];
  editingMaterialId: string | null;
  initialValues?: Partial<BomMaterialFormValues>;
  onSubmit: (values: BomMaterialFormValues) => void;
  onCancel: () => void;
}

export function BomMaterialForm({
  appState,
  materialOptions,
  supplierOptions,
  unitOptions,
  editingMaterialId,
  initialValues,
  onSubmit,
  onCancel,
}: BomMaterialFormProps) {
  const [materialSearch, setMaterialSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [materialSuggestOpen, setMaterialSuggestOpen] = useState(false);
  const [supplierSuggestOpen, setSupplierSuggestOpen] = useState(false);
  const [form, setForm] = useState<BomMaterialFormValues>({ ...EMPTY_FORM, ...initialValues });
  const supplierTouchedRef = useRef(false);
  const materialBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supplierBlurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (materialBlurTimerRef.current) clearTimeout(materialBlurTimerRef.current);
      if (supplierBlurTimerRef.current) clearTimeout(supplierBlurTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialValues) {
      setForm({ ...EMPTY_FORM, ...initialValues });
      setMaterialSearch(initialValues.name ?? '');
      setSupplierSearch(initialValues.preferredSupplier ?? '');
      supplierTouchedRef.current = Boolean(initialValues.preferredSupplier?.trim());
      setMaterialSuggestOpen(false);
      setSupplierSuggestOpen(false);
    }
  }, [initialValues, editingMaterialId]);

  const effectiveQty = useMemo(
    () => Number(calcEffectiveQty(form.qtyPerProduct, form.wastagePct).toFixed(2)),
    [form.qtyPerProduct, form.wastagePct],
  );

  const materialLabel = materialSearch.trim() || form.name.trim();

  const insight = useMemo(
    () => getMaterialInsight(appState, materialLabel, form.materialId, effectiveQty),
    [appState, materialLabel, form.materialId, effectiveQty],
  );

  useEffect(() => {
    if (!materialLabel.trim() || supplierTouchedRef.current) return;

    if (!insight.showSupplierSuggestions) {
      if (form.preferredSupplier || supplierSearch) {
        setForm((p) => ({ ...p, preferredSupplier: '' }));
        setSupplierSearch('');
      }
      return;
    }

    if (insight.recommendedSupplier && form.preferredSupplier !== insight.recommendedSupplier) {
      setForm((p) => ({ ...p, preferredSupplier: insight.recommendedSupplier }));
      setSupplierSearch(insight.recommendedSupplier);
    }
  }, [
    materialLabel,
    insight.showSupplierSuggestions,
    insight.recommendedSupplier,
    form.preferredSupplier,
    supplierSearch,
  ]);

  const filteredMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    if (!q) return materialOptions;
    return materialOptions.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    );
  }, [materialOptions, materialSearch]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    if (!q) return supplierOptions;
    return supplierOptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [supplierOptions, supplierSearch]);

  const selectedMaterial = materialOptions.find((m) => m.id === form.materialId);

  const closeMaterialSuggest = () => {
    if (materialBlurTimerRef.current) clearTimeout(materialBlurTimerRef.current);
    setMaterialSuggestOpen(false);
  };

  const closeSupplierSuggest = () => {
    if (supplierBlurTimerRef.current) clearTimeout(supplierBlurTimerRef.current);
    setSupplierSuggestOpen(false);
  };

  const handleMaterialFocus = () => {
    if (materialBlurTimerRef.current) clearTimeout(materialBlurTimerRef.current);
    setMaterialSuggestOpen(true);
  };

  const handleMaterialBlur = () => {
    materialBlurTimerRef.current = setTimeout(() => setMaterialSuggestOpen(false), 150);
  };

  const handleSupplierFocus = () => {
    if (supplierBlurTimerRef.current) clearTimeout(supplierBlurTimerRef.current);
    setSupplierSuggestOpen(true);
  };

  const handleSupplierBlur = () => {
    supplierBlurTimerRef.current = setTimeout(() => setSupplierSuggestOpen(false), 150);
  };

  const pickMaterial = (option: MaterialOption) => {
    supplierTouchedRef.current = false;
    const materialInsight = getMaterialInsight(appState, option.name, option.id, effectiveQty);

    const preferredSupplier =
      materialInsight.showSupplierSuggestions && materialInsight.recommendedSupplier
        ? materialInsight.recommendedSupplier
        : '';

    setSupplierSearch(preferredSupplier);
    setForm((prev) => ({
      ...prev,
      materialId: option.id,
      name: option.name,
      category: option.category,
      unit: option.unit,
      standardCost: option.standardCost,
      preferredSupplier,
    }));
    setMaterialSearch(option.name);
    closeMaterialSuggest();
  };

  const pickSupplier = (name: string) => {
    supplierTouchedRef.current = true;
    setForm((p) => ({ ...p, preferredSupplier: name }));
    setSupplierSearch(name);
    closeSupplierSuggest();
  };

  const handleMaterialInput = (value: string) => {
    supplierTouchedRef.current = false;
    setMaterialSearch(value);
    setMaterialSuggestOpen(true);
    setForm((prev) => ({
      ...prev,
      materialId: '',
      name: value,
      category: prev.category || 'General',
    }));
  };

  const handleSupplierInput = (value: string) => {
    supplierTouchedRef.current = true;
    setSupplierSearch(value);
    setSupplierSuggestOpen(true);
    setForm((p) => ({ ...p, preferredSupplier: value }));
  };

  const handleAttachment = async (file: File | null) => {
    if (!file) {
      setForm((p) => ({ ...p, attachmentName: undefined, attachmentDataUrl: undefined }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Action required', { module: 'Purchases', description: "File must be 5MB or smaller." });
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Action required', { module: 'Purchases', description: "Only JPG, PNG, WebP and PDF files are allowed." });
      return;
    }

    // Use Cloudinary for images
    if (file.type.startsWith('image/')) {
      toast.info('Uploading image...', { module: 'Purchases' });
      try {
        const { uploadImageToCloudinary } = await import('@/lib/services/cloudinary-service');
        const res = await uploadImageToCloudinary(file);
        setForm((p) => ({
          ...p,
          attachmentName: file.name,
          attachmentDataUrl: res.url, // save cloudinary URL here
        }));
        toast.success('Upload complete', { module: 'Purchases' });
      } catch (err: any) {
        toast.error('Upload failed', { module: 'Purchases', description: err.message });
      }
    } else {
      // Fallback for PDF to base64
      const reader = new FileReader();
      reader.onload = () => {
        setForm((p) => ({
          ...p,
          attachmentName: file.name,
          attachmentDataUrl: String(reader.result ?? ''),
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const name = (form.name || materialSearch).trim();
    if (!name) {
      toast.error('Action required', { module: 'Purchases', description: "Please select or enter a material." });
      return;
    }
    if (form.qtyPerProduct <= 0) {
      toast.error('Action required', { module: 'Purchases', description: "Qty per product must be greater than zero." });
      return;
    }
    if (form.standardCost <= 0) {
      toast.error('Action required', { module: 'Purchases', description: "Cost must be greater than zero." });
      return;
    }
    onSubmit({ ...form, name, category: form.category || insight.category || 'General' });
  };

  return (
    <div className="premium-card premium-shadow p-4 md:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="relative w-full">
            <BomFieldLabel required>Material / Component</BomFieldLabel>
            <div className="relative">
              <input
                type="search"
                required
                value={materialSearch}
                onChange={(e) => handleMaterialInput(e.target.value)}
                onFocus={handleMaterialFocus}
                onBlur={handleMaterialBlur}
                placeholder="Search material name or code..."
                className={`${INPUT_CLS} pr-10 uppercase placeholder:normal-case`}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {materialSuggestOpen && filteredMaterials.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filteredMaterials.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickMaterial(m)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 truncate">{m.name}</span>
                      <span className="block text-[10px] text-slate-500 font-semibold">
                        {m.category} · {m.code} · Available: {m.availability} {m.unit} · {formatMoney(m.standardCost)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedMaterial && (
              <p className={`text-[10px] font-semibold mt-1 ${selectedMaterial.availability <= (selectedMaterial.threshold ?? 0) ? 'text-orange-600' : 'text-slate-500'}`}>
                {selectedMaterial.category} · {selectedMaterial.code} · Available: {selectedMaterial.availability} {selectedMaterial.unit} · Last price {formatMoney(selectedMaterial.standardCost)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[5.5rem_5.5rem_5.5rem_minmax(4rem,0.85fr)_minmax(5.5rem,1.05fr)_auto] gap-2 items-end">
            <div className="min-w-0">
              <BomFieldLabel required>Unit</BomFieldLabel>
              <select required value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className={UNIT_SELECT_CLS}>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <BomFieldLabel required>Qty</BomFieldLabel>
              <input
                type="number"
                required
                min={0.01}
                step={0.01}
                value={numberInputValue(form.qtyPerProduct)}
                onChange={(e) => setForm((p) => ({ ...p, qtyPerProduct: parseNumberInput(e.target.value) }))}
                onFocus={(e) => e.target.select()}
                className={INPUT_CLS}
              />
            </div>

            <div className="min-w-0">
              <BomFieldLabel required>Cost</BomFieldLabel>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">৳</span>
                <input
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={numberInputValue(form.standardCost)}
                  onChange={(e) => setForm((p) => ({ ...p, standardCost: parseNumberInput(e.target.value) }))}
                  onFocus={(e) => e.target.select()}
                  className={`${INPUT_CLS} pl-7`}
                />
              </div>
            </div>

            <div className="min-w-0">
              <BomFieldLabel optional>Note / Remarks</BomFieldLabel>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                className={INPUT_CLS}
                placeholder="Add any note..."
              />
            </div>

            <div className="min-w-0 relative">
              <BomFieldLabel optional>Preferred Supplier</BomFieldLabel>
              <div className="relative">
                <input
                  type="search"
                  value={supplierSearch}
                  onChange={(e) => handleSupplierInput(e.target.value)}
                  onFocus={handleSupplierFocus}
                  onBlur={handleSupplierBlur}
                  placeholder="Search for preferred..."
                  className={`${INPUT_CLS} pr-10`}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {supplierSuggestOpen && filteredSuppliers.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSupplier(s.name)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <BomFieldLabel optional>Attachment</BomFieldLabel>
              <div className="flex items-center gap-1 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-xs font-semibold text-slate-600 cursor-pointer transition-colors whitespace-nowrap">
                  <CloudUpload className="w-4 h-4 text-blue-500 shrink-0" />
                  Upload file
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => handleAttachment(e.target.files?.[0] ?? null)}
                  />
                </label>
                {form.attachmentName && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold max-w-[5rem] truncate">
                    {form.attachmentName}
                    <button type="button" onClick={() => handleAttachment(null)} className="cursor-pointer shrink-0" aria-label="Remove attachment">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0 xl:justify-end self-start">
          <div className="w-full sm:w-[200px] shrink-0 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-700">
              <Calculator className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wide leading-tight">Effective Requirement</span>
            </div>
            <p className="text-base font-extrabold text-emerald-800 leading-tight">
              {effectiveQty} {form.unit}
              <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">per finished product</span>
            </p>
            <p className="text-[11px] font-semibold text-emerald-700 leading-snug">
              For 100 products, <span className="font-extrabold">{(effectiveQty * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} {form.unit}</span> required.
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold pt-1 border-t border-emerald-100">
              Est. cost / product: {formatMoney(calcCostPerProduct(effectiveQty, form.standardCost))}
            </p>
          </div>

          <BomMaterialInsight
            className="w-full sm:w-[200px] shrink-0"
            insight={insight}
            materialName={materialLabel}
            onSelectSupplier={pickSupplier}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer">
          <Plus className="w-4 h-4" />
          {editingMaterialId ? 'Update Material' : 'Add Material'}
        </button>
      </div>
    </div>
  );
}

export { EMPTY_FORM as BOM_MATERIAL_EMPTY_FORM };
