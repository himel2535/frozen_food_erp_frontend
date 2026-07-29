import type { AppState } from '@/lib/state/types';
import {
  listFromState,
  createInState,
  updateInState,
  deleteFromState,
  formatCurrency,
} from '@/lib/services/domain-service';

export type BomMaterial = {
  id: string;
  materialId: string;
  name: string;
  category: string;
  unit: string;
  qtyPerProduct: number;
  wastagePct: number;
  effectiveQty: number;
  standardCost: number;
  costPerProduct: number;
  preferredSupplier?: string;
  remarks?: string;
};

export type Recipe = {
  id: string;
  productSku: string;
  product: string;
  productId?: string | number;
  status: 'active' | 'inactive';
  materials: BomMaterial[];
  notes?: string;
};

export type MaterialOption = {
  id: string;
  name: string;
  category: string;
  unit: string;
  standardCost: number;
  availability: number;
  code: string;
};

type Row = Record<string, unknown>;

export function calcEffectiveQty(qtyPerProduct: number, wastagePct: number) {
  return qtyPerProduct * (1 + wastagePct / 100);
}

export function calcCostPerProduct(effectiveQty: number, standardCost: number) {
  return effectiveQty * standardCost;
}

export function buildBomMaterial(payload: Partial<BomMaterial> & { name: string; unit: string }): BomMaterial {
  const qtyPerProduct = Number(payload.qtyPerProduct ?? 1);
  const wastagePct = Number(payload.wastagePct ?? 0);
  const standardCost = Number(payload.standardCost ?? 0);
  const effectiveQty = calcEffectiveQty(qtyPerProduct, wastagePct);
  const costPerProduct = calcCostPerProduct(effectiveQty, standardCost);
  return {
    id: String(payload.id ?? `mat-${Date.now()}`),
    materialId: String(payload.materialId ?? payload.id ?? `mat-${Date.now()}`),
    name: payload.name,
    category: String(payload.category ?? 'General'),
    unit: payload.unit,
    qtyPerProduct,
    wastagePct,
    effectiveQty: Number(effectiveQty.toFixed(2)),
    standardCost,
    costPerProduct: Number(costPerProduct.toFixed(2)),
    preferredSupplier: payload.preferredSupplier,
    remarks: payload.remarks,
  };
}

export function listRecipes(state: AppState): Recipe[] {
  return listFromState(state, 'recipes').map(normalizeRecipe);
}

function normalizeRecipe(row: Row): Recipe {
  const materials = Array.isArray(row.materials)
    ? (row.materials as Row[]).map((m) => buildBomMaterial(m as Partial<BomMaterial> & { name: string; unit: string }))
    : [];
  return {
    id: String(row.id ?? ''),
    productSku: String(row.productSku ?? row.product ?? ''),
    product: String(row.product ?? ''),
    productId: row.productId as string | number | undefined,
    status: (row.status === 'inactive' ? 'inactive' : 'active') as Recipe['status'],
    materials,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function getRecipe(state: AppState, id: string): Recipe | null {
  return listRecipes(state).find((r) => r.id === id) ?? null;
}

export function getRecipeMetrics(recipes: Recipe[]) {
  const active = recipes.filter((r) => r.status === 'active').length;
  const costs = recipes.map((r) => r.materials.reduce((s, m) => s + m.costPerProduct, 0));
  const avgCost = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
  return { total: recipes.length, active, avgCost };
}

export function getRecipeBomCost(recipe: Recipe) {
  return recipe.materials.reduce((s, m) => s + m.costPerProduct, 0);
}

export function getRecipeBomTotals(recipe: Recipe) {
  const totalMaterials = recipe.materials.length;
  const totalEffective = recipe.materials.reduce((s, m) => s + m.effectiveQty, 0);
  const estimatedCost = recipe.materials.reduce((s, m) => s + m.costPerProduct, 0);
  return {
    totalMaterials,
    totalEffective: Number(totalEffective.toFixed(2)),
    estimatedCost: Number(estimatedCost.toFixed(2)),
  };
}

export function listMaterialOptions(state: AppState): MaterialOption[] {
  const raw = listFromState(state, 'rawMaterials');
  const inventory = listFromState(state, 'inventory').filter((p) => {
    const type = String(p.productType ?? '').toLowerCase();
    return type.includes('raw') || type.includes('semi');
  });

  const fromRaw = raw.map((r) => ({
    id: String(r.id),
    name: String(r.name ?? ''),
    category: String(r.category ?? 'Raw Materials'),
    unit: String(r.unit ?? 'pcs'),
    standardCost: Number(r.price ?? 0),
    availability: Number(r.quantity ?? 0),
    code: String(r.id),
  }));

  const fromInv = inventory.map((p) => ({
    id: `inv-${p.id}`,
    name: String(p.name ?? ''),
    category: String(p.category ?? 'Inventory'),
    unit: String(p.uom ?? 'pcs'),
    standardCost: Number(p.cost ?? p.price ?? 0),
    availability: Number(p.stock ?? 0),
    code: String(p.sku ?? p.id),
  }));

  const seen = new Set<string>();
  return [...fromRaw, ...fromInv].filter((m) => {
    const key = m.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return m.name.length > 0;
  });
}

export function listFinishedProducts(state: AppState) {
  return listFromState(state, 'inventory').filter((p) => {
    const type = String(p.productType ?? '').toLowerCase();
    return type.includes('finished') || type.includes('semi');
  });
}

export function listSupplierOptions(state: AppState) {
  return listFromState(state, 'purchasesSuppliers').map((s) => ({
    id: String(s.id),
    name: String(s.name ?? s.id),
  }));
}

export function createRecipe(
  state: AppState,
  payload: { productSku: string; product: string; productId?: string | number; status?: string; notes?: string },
) {
  const existing = listRecipes(state).find((r) => r.productSku === payload.productSku);
  if (existing) return { ok: false as const, error: 'A recipe already exists for this product SKU' };
  return createInState(state, 'recipes', {
    ...payload,
    status: payload.status ?? 'active',
    materials: [],
  }, 'RCP');
}

export function updateRecipe(state: AppState, id: string, payload: Partial<Recipe>) {
  return updateInState(state, 'recipes', id, payload as Row);
}

export function deleteRecipe(state: AppState, id: string) {
  return deleteFromState(state, 'recipes', id);
}

export function addMaterialToRecipe(state: AppState, recipeId: string, material: Partial<BomMaterial> & { name: string; unit: string }) {
  const recipe = getRecipe(state, recipeId);
  if (!recipe) return { ok: false as const, error: 'Recipe not found' };
  const next = buildBomMaterial(material);
  return updateInState(state, 'recipes', recipeId, {
    materials: [...recipe.materials, next],
  });
}

export function updateMaterialInRecipe(
  state: AppState,
  recipeId: string,
  materialId: string,
  material: Partial<BomMaterial> & { name: string; unit: string },
) {
  const recipe = getRecipe(state, recipeId);
  if (!recipe) return { ok: false as const, error: 'Recipe not found' };
  const nextMaterial = buildBomMaterial({ ...material, id: materialId, materialId: material.materialId ?? materialId });
  const materials = recipe.materials.map((m) => (m.id === materialId ? nextMaterial : m));
  return updateInState(state, 'recipes', recipeId, { materials });
}

export function removeMaterialFromRecipe(state: AppState, recipeId: string, materialId: string) {
  const recipe = getRecipe(state, recipeId);
  if (!recipe) return { ok: false as const, error: 'Recipe not found' };
  const materials = recipe.materials.filter((m) => m.id !== materialId);
  return updateInState(state, 'recipes', recipeId, { materials });
}

export { formatCurrency as formatMoney };
