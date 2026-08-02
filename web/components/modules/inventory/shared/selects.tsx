'use client';

import type { AppState } from '@/lib/state/types';
import { listInventory, listWarehouses, listCategories, listUnits } from '@/lib/services/inventory-service';
import { listSuppliers } from '@/lib/services/purchases-service';
import { findRecipeForProduct, listRecipes } from '@/lib/services/recipes-service';
import { SELECT_CLS } from '@/components/modules/inventory/shared/inventory-ui';

export function ProductSelect({
  state,
  value,
  onChange,
  required,
  includeAll,
  productType,
}: {
  state: AppState;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  includeAll?: boolean;
  productType?: string;
}) {
  const products = listInventory(state, productType
    ? { productType, excludeRaw: true }
    : undefined);
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      {includeAll && <option value="all">All Products</option>}
      <option value="">Select Product</option>
      {products.map((p) => (
        <option key={String(p.id)} value={String(p.id)}>{String(p.name)} ({String(p.sku)})</option>
      ))}
    </select>
  );
}

export function RecipeSelect({
  state,
  value,
  onChange,
  required,
  filterProduct,
}: {
  state: AppState;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  filterProduct?: { id?: string; sku?: string; name?: string };
}) {
  const active = listRecipes(state).filter((r) => r.status === 'active');
  const matched = filterProduct
    ? findRecipeForProduct(state, filterProduct)
    : null;

  const recipes = matched
    ? [matched, ...active.filter((r) => r.id !== matched.id)]
    : active;

  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      <option value="">Select BOM / Recipe</option>
      {recipes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.recipeNumber} — {r.product} ({r.model})
        </option>
      ))}
    </select>
  );
}

export function WarehouseSelect({ state, value, onChange, required, includeAll }: { state: AppState; value: string; onChange: (v: string) => void; required?: boolean; includeAll?: boolean }) {
  const warehouses = listWarehouses(state);
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      {includeAll && <option value="all">All Warehouses</option>}
      <option value="">Select Warehouse</option>
      {warehouses.map((w) => (
        <option key={String(w.id)} value={String(w.id)}>{String(w.name)}</option>
      ))}
    </select>
  );
}

export function SupplierSelect({ state, value, onChange, required }: { state: AppState; value: string; onChange: (v: string) => void; required?: boolean }) {
  const suppliers = listSuppliers(state);
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      <option value="">Select Supplier</option>
      {suppliers.map((s) => (
        <option key={String(s.id)} value={String(s.id)}>{String(s.name)}</option>
      ))}
    </select>
  );
}

export function CategorySelect({ state, value, onChange, byName }: { state: AppState; value: string; onChange: (v: string) => void; byName?: boolean }) {
  const categories = listCategories(state);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      <option value="">Select Category</option>
      {categories.map((c) => (
        <option key={String(c.id)} value={byName ? String(c.name) : String(c.id)}>{String(c.name)}</option>
      ))}
    </select>
  );
}

export function UnitSelect({ state, value, onChange, byCode }: { state: AppState; value: string; onChange: (v: string) => void; byCode?: boolean }) {
  const units = listUnits(state);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      <option value="">Select Unit</option>
      {units.map((u) => (
        <option key={String(u.id)} value={byCode ? String(u.code) : String(u.id)}>{String(u.name)} ({String(u.symbol ?? u.code)})</option>
      ))}
    </select>
  );
}
