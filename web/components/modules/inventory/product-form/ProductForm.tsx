'use client';

import { toast } from '@/lib/ui/feedback';

import Link from 'next/link';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Barcode,
  ChevronDown,
  FileSpreadsheet,
  Package,
  Tag,
  Warehouse,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import {
  CF_BTN_OUTLINE,
  CF_FIELD_ERROR_CLS,
  CF_INPUT_CLS,
  CF_LABEL_CLS,
  CF_SELECT_CLS,
  CF_TEXTAREA_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import { IconInput, IconSelect } from '@/components/modules/crm/customer-form/IconField';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { formatMoney } from '@/lib/services/inventory-service';
import { ProductFormFooter, useProductSaveAction } from '@/components/modules/inventory/product-form/ProductFormFooter';
import { ProductTypeSelector } from '@/components/modules/inventory/product-form/ProductTypeSelector';
import { PRODUCT_TAX_OPTIONS } from '@/components/modules/inventory/product-form/product-form-options';
import {
  computeProfitMargin,
  formValuesToPayload,
  type ProductFormPayload,
  type ProductFormValues,
} from '@/components/modules/inventory/product-form/product-form-types';
import {
  validateProductForm,
  type ProductFieldError,
} from '@/components/modules/inventory/product-form/product-form-validation';

export function ProductForm({
  mode,
  initialValues,
  warehouseStock: initialWarehouseStock,
  categories,
  units,
  warehouses,
  onGenerateSku,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: ProductFormValues;
  warehouseStock: Record<string, string>;
  categories: Array<Record<string, unknown>>;
  units: Array<Record<string, unknown>>;
  warehouses: Array<Record<string, unknown>>;
  onGenerateSku: () => string;
  onCancel: () => void;
  onSave: (payload: ProductFormPayload, action: 'save' | 'save-and-add') => void;
}) {
  const [form, setForm] = useState<ProductFormValues>(initialValues);
  const [warehouseStock, setWarehouseStock] = useState(initialWarehouseStock);
  const [errors, setErrors] = useState<ProductFieldError>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { setSaveAction, readSaveAction } = useProductSaveAction();

  const warehouseIds = useMemo(
    () => warehouses.map((wh) => String(wh.id)),
    [warehouses],
  );

  const costNum = Number(form.cost || 0);
  const priceNum = Number(form.price || 0);
  const { profit, marginPct } = useMemo(
    () => computeProfitMargin(costNum, priceNum),
    [costNum, priceNum],
  );

  const uomLabel = form.uom || 'Pieces';

  const updateForm = (patch: Partial<ProductFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof ProductFormValues>;
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateProductForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`pf-field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    onSave(formValuesToPayload(form, warehouseStock, warehouseIds), readSaveAction());
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Product' : 'Create New Product'}
            subtitle="Add a new product to your inventory."
            onBack={onCancel}
          />
          <button
            type="button"
            onClick={() => toast.info('Feature coming soon', { module: 'Inventory', description: "Import Excel" })}
            className={`${CF_BTN_OUTLINE} self-start`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Import from Excel
          </button>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <FormSectionCard number={1} title="Basic Information" subtitle="Add essential details about the product.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div id="pf-field-name">
                  <label className={CF_LABEL_CLS}>
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="Enter product name"
                    className={`${CF_INPUT_CLS} pl-4 ${errors.name ? 'border-rose-400' : ''}`}
                  />
                  {errors.name ? <p className={CF_FIELD_ERROR_CLS}>{errors.name}</p> : null}
                </div>

                <div id="pf-field-sku">
                  <label className={CF_LABEL_CLS}>
                    SKU / Product Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => updateForm({ sku: e.target.value })}
                      placeholder="TOY-000124"
                      className={`${CF_INPUT_CLS} pl-4 flex-1 min-w-0 ${errors.sku ? 'border-rose-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => updateForm({ sku: onGenerateSku() })}
                      className="shrink-0 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  {errors.sku ? <p className={CF_FIELD_ERROR_CLS}>{errors.sku}</p> : null}
                </div>

                <div id="pf-field-uom">
                  <label className={CF_LABEL_CLS}>
                    Unit of Measure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.uom}
                    onChange={(e) => updateForm({ uom: e.target.value })}
                    className={`${CF_SELECT_CLS} pl-4 cursor-pointer ${errors.uom ? 'border-rose-400' : ''}`}
                  >
                    <option value="">Select unit</option>
                    {units.map((u) => (
                      <option key={String(u.id)} value={String(u.code)}>{String(u.name ?? u.code)}</option>
                    ))}
                  </select>
                  {errors.uom ? <p className={CF_FIELD_ERROR_CLS}>{errors.uom}</p> : null}
                </div>

                <div id="pf-field-category">
                  <label className={CF_LABEL_CLS}>
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.category}
                      onChange={(e) => updateForm({ category: e.target.value })}
                      className={`${CF_SELECT_CLS} pl-4 flex-1 min-w-0 cursor-pointer ${errors.category ? 'border-rose-400' : ''}`}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={String(c.id)} value={String(c.name)}>{String(c.name)}</option>
                      ))}
                    </select>
                    <Link
                      href="/inventory/categories"
                      className="shrink-0 inline-flex items-center px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      + New
                    </Link>
                  </div>
                  {errors.category ? <p className={CF_FIELD_ERROR_CLS}>{errors.category}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label className={CF_LABEL_CLS}>Barcode / Internal Code (Optional)</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={(e) => updateForm({ barcode: e.target.value })}
                      placeholder="Scan or enter barcode"
                      className={CF_INPUT_CLS}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="Product Image"
                    value={form.imageUrl}
                    onChange={(url) => updateForm({ imageUrl: url })}
                  />
                </div>
              </div>
            </FormSectionCard>

            <FormSectionCard number={2} title="Product Type" subtitle="Select the type of this product.">
              <ProductTypeSelector
                value={form.productTypeId}
                onChange={(productTypeId) => updateForm({ productTypeId })}
              />
            </FormSectionCard>
          </div>

          <FormSectionCard number={3} title="Pricing" subtitle="Set pricing and tax information.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div id="pf-field-cost">
                <label className={CF_LABEL_CLS}>
                  Cost Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => updateForm({ cost: e.target.value })}
                    placeholder="0.00"
                    className={`${CF_INPUT_CLS} pl-8 ${errors.cost ? 'border-rose-400' : ''}`}
                  />
                </div>
                {errors.cost ? <p className={CF_FIELD_ERROR_CLS}>{errors.cost}</p> : null}
              </div>

              <div id="pf-field-price">
                <label className={CF_LABEL_CLS}>
                  Selling Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateForm({ price: e.target.value })}
                    placeholder="0.00"
                    className={`${CF_INPUT_CLS} pl-8 ${errors.price ? 'border-rose-400' : ''}`}
                  />
                </div>
                {errors.price ? <p className={CF_FIELD_ERROR_CLS}>{errors.price}</p> : null}
              </div>

              <div>
                <label className={CF_LABEL_CLS}>Profit / Margin</label>
                <div className="rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-2 min-h-[38px] flex flex-col justify-center">
                  <span className="text-xs font-extrabold text-slate-900">{formatMoney(profit)}</span>
                  <span className="text-[10px] font-bold text-slate-500">{marginPct.toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <label className={CF_LABEL_CLS}>Tax / VAT (Optional)</label>
                <select
                  value={form.taxLabel}
                  onChange={(e) => updateForm({ taxLabel: e.target.value })}
                  className={`${CF_SELECT_CLS} pl-4 cursor-pointer`}
                >
                  {PRODUCT_TAX_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard number={4} title="Opening Inventory" subtitle="Set initial stock for this product.">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-3">
                <div id="pf-field-openingStock">
                  <label className={CF_LABEL_CLS}>
                    Opening Stock <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={form.openingStock}
                      onChange={(e) => updateForm({ openingStock: e.target.value })}
                      className={`${CF_INPUT_CLS} pl-4 flex-1 ${errors.openingStock ? 'border-rose-400' : ''}`}
                    />
                    <span className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 shrink-0">
                      {uomLabel}
                    </span>
                  </div>
                  {errors.openingStock ? <p className={CF_FIELD_ERROR_CLS}>{errors.openingStock}</p> : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={CF_LABEL_CLS}>Minimum Stock (Alert)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minStock}
                      onChange={(e) => updateForm({ minStock: e.target.value })}
                      className={`${CF_INPUT_CLS} pl-4`}
                    />
                  </div>
                  <div>
                    <label className={CF_LABEL_CLS}>Typical duration (days)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 10"
                      value={form.stockDurationDays}
                      onChange={(e) => updateForm({ stockDurationDays: e.target.value })}
                      className={`${CF_INPUT_CLS} pl-4`}
                    />
                    <p className="text-[11px] font-medium text-slate-500 mt-1">
                      How many days this stock usually lasts.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allocateAcrossWarehouses}
                    onChange={(e) => updateForm({ allocateAcrossWarehouses: e.target.checked })}
                    className="mt-0.5 cursor-pointer"
                  />
                  <span>
                    <span className="block text-xs font-bold text-slate-800">Allocate opening stock across warehouses</span>
                    <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">
                      Enable to set stock for each warehouse separately.
                    </span>
                  </span>
                </label>

                {form.allocateAcrossWarehouses ? (
                  <div className="grid gap-3 pt-1 grid-cols-2 md:grid-flow-col md:auto-cols-fr">
                    {warehouses.map((wh) => (
                      <div key={String(wh.id)} className="min-w-0">
                        <label className={CF_LABEL_CLS}>{String(wh.name)} Stock</label>
                        <input
                          type="number"
                          min="0"
                          value={warehouseStock[String(wh.id)] ?? '0'}
                          onChange={(e) =>
                            setWarehouseStock({ ...warehouseStock, [String(wh.id)]: e.target.value })
                          }
                          className={`${CF_INPUT_CLS} pl-4 min-w-0`}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-start gap-2.5 max-w-xs p-3 rounded-xl border border-blue-200/80 bg-blue-50/90 shrink-0">
                <Warehouse className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-blue-800">Quick Tip</p>
                  <p className="text-[11px] font-semibold text-blue-700/90 mt-0.5 leading-relaxed">
                    Keep minimum stock level to get notified when stock is running low.
                  </p>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <section className="premium-card premium-shadow overflow-hidden min-h-0">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-start gap-3 p-4 md:p-5 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-extrabold shrink-0">
                5
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Advanced Product Details</h4>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Add additional information, stock rules, supplier, description, images and more.
                </p>
              </div>
            </button>

            {showAdvanced ? (
              <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 space-y-3 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                  <IconInput
                    label="Wholesale Price"
                    icon={Tag}
                    type="number"
                    value={form.wholesalePrice}
                    onChange={(e) => updateForm({ wholesalePrice: e.target.value })}
                    placeholder="0.00"
                  />
                  <IconInput
                    label="Reorder Level"
                    icon={Package}
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) => updateForm({ reorderLevel: e.target.value })}
                    placeholder="0"
                  />
                  <IconSelect
                    label="Default Warehouse"
                    icon={Warehouse}
                    value={form.defaultWarehouse}
                    onChange={(e) => updateForm({ defaultWarehouse: e.target.value })}
                  >
                    {warehouses.map((wh) => (
                      <option key={String(wh.id)} value={String(wh.id)}>{String(wh.name)}</option>
                    ))}
                  </IconSelect>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={CF_LABEL_CLS}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm({ description: e.target.value })}
                      placeholder="Product description..."
                      className={CF_TEXTAREA_CLS}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pf-discontinued"
                      checked={form.discontinued}
                      onChange={(e) => updateForm({ discontinued: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="pf-discontinued" className="cursor-pointer text-xs font-semibold text-slate-700">
                      Discontinued
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <ProductFormFooter
          onCancel={onCancel}
          onSaveAndAdd={() => {
            setSaveAction('save-and-add');
            formRef.current?.requestSubmit();
          }}
          submitLabel={mode === 'edit' ? 'Update Product' : 'Save Product'}
        />
      </form>
    </div>
  );
}
