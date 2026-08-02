import type { AppState } from '@/lib/state/types';
import {
  listFromState,
  createInState,
  updateInState,
  deleteFromState,
  formatCurrency,
} from '@/lib/services/domain-service';

export type StockStatus = 'ok' | 'low' | 'out' | 'unknown';

export type SupplierOffer = {
  supplierId: string;
  supplierName: string;
  price: number;
  availableQty: number;
  canFulfill: boolean;
};

export type MaterialInsight = {
  inInventory: boolean;
  availability: number;
  threshold: number;
  unit: string;
  stockStatus: StockStatus;
  lastPrice: number;
  category: string;
  code: string;
  suggestedSuppliers: string[];
  requiredQty: number;
  insufficientForBom: boolean;
  showSupplierSuggestions: boolean;
  supplierOffers: SupplierOffer[];
  recommendedSupplier: string;
};

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
  attachmentName?: string;
  attachmentDataUrl?: string;
};

export type Recipe = {
  id: string;
  recipeNumber: string;
  product: string;
  model: string;
  version: string;
  productSku: string;
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
  threshold?: number;
  supplierId?: string;
};

type Row = Record<string, unknown>;

function nextRecipeId(state: AppState): string {
  const rows = listFromState(state, 'recipes');
  const nums = rows
    .map((r) => String(r.id ?? r.recipeNumber ?? ''))
    .filter((id) => id.startsWith('RCP'))
    .map((id) => parseInt(id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `RCP-${String(max + 1).padStart(3, '0')}`;
}

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
    preferredSupplier: payload.preferredSupplier ?? '',
    remarks: payload.remarks ?? '',
    attachmentName: payload.attachmentName ?? '',
    attachmentDataUrl: payload.attachmentDataUrl ?? '',
  };
}

function resolveStockStatus(availability: number, threshold: number): StockStatus {
  if (availability <= 0) return 'out';
  if (threshold > 0 && availability <= threshold) return 'low';
  return 'ok';
}

function findRawMaterial(state: AppState, nameOrId: string) {
  const q = nameOrId.trim().toLowerCase();
  if (!q) return null;
  return listFromState(state, 'rawMaterials').find((r) => {
    const id = String(r.id ?? '').toLowerCase();
    const name = String(r.name ?? '').toLowerCase();
    return id === q || name === q || name.includes(q) || q.includes(name);
  }) ?? null;
}

function findInventoryMaterial(state: AppState, nameOrId: string) {
  const q = nameOrId.trim().toLowerCase();
  if (!q) return null;
  return listFromState(state, 'inventory').find((p) => {
    const sku = String(p.sku ?? '').toLowerCase();
    const name = String(p.name ?? '').toLowerCase();
    const id = String(p.id ?? '').toLowerCase();
    return sku === q || name === q || id === q || name.includes(q) || q.includes(name);
  }) ?? null;
}

function supplierName(state: AppState, supplierId: string) {
  const suppliers = listFromState(state, 'purchasesSuppliers');
  const match = suppliers.find((s) => String(s.id) === supplierId);
  return match ? String(match.name ?? supplierId) : '';
}

type RawOfferRow = { supplierId?: string; price?: number; availableQty?: number };

function parseSupplierOffers(state: AppState, raw: Row, requiredQty: number): SupplierOffer[] {
  const offers: SupplierOffer[] = [];
  const seen = new Set<string>();

  const pushOffer = (supplierId: string, price: number, availableQty: number) => {
    if (!supplierId || seen.has(supplierId)) return;
    seen.add(supplierId);
    offers.push({
      supplierId,
      supplierName: supplierName(state, supplierId),
      price,
      availableQty,
      canFulfill: availableQty > 0 && (requiredQty <= 0 || availableQty >= requiredQty),
    });
  };

  const extra = raw.supplierOffers;
  if (Array.isArray(extra)) {
    for (const row of extra as RawOfferRow[]) {
      pushOffer(String(row.supplierId ?? ''), Number(row.price ?? 0), Number(row.availableQty ?? 0));
    }
  }

  const primaryId = String(raw.supplierId ?? '');
  if (primaryId) {
    pushOffer(primaryId, Number(raw.price ?? 0), Number(raw.quantity ?? 0));
  }

  return offers.sort((a, b) => a.price - b.price || b.availableQty - a.availableQty);
}

function pickRecommendedSupplier(offers: SupplierOffer[]): string {
  const withStock = offers.filter((o) => o.availableQty > 0);
  if (!withStock.length) return '';
  return withStock.sort((a, b) => a.price - b.price || b.availableQty - a.availableQty)[0]?.supplierName ?? '';
}

function shouldShowSupplierSuggestions(
  inInventory: boolean,
  insufficientForBom: boolean,
  stockStatus: StockStatus,
): boolean {
  if (!inInventory) return true;
  if (insufficientForBom) return true;
  if (stockStatus === 'out') return true;
  if (stockStatus === 'low') return true;
  return false;
}

function buildInsightBase(
  fields: Omit<
    MaterialInsight,
    'supplierOffers' | 'recommendedSupplier' | 'suggestedSuppliers' | 'showSupplierSuggestions'
  >,
  rawForOffers: Row | null,
  requiredQty: number,
  state: AppState,
): MaterialInsight {
  const showSupplierSuggestions = shouldShowSupplierSuggestions(
    fields.inInventory,
    fields.insufficientForBom,
    fields.stockStatus,
  );

  let supplierOffers: SupplierOffer[] = [];
  if (showSupplierSuggestions && rawForOffers) {
    supplierOffers = parseSupplierOffers(state, rawForOffers, requiredQty);
  }

  const recommendedSupplier = showSupplierSuggestions ? pickRecommendedSupplier(supplierOffers) : '';
  const suggestedSuppliers = supplierOffers.map((o) => o.supplierName).filter(Boolean);

  return {
    ...fields,
    showSupplierSuggestions,
    supplierOffers,
    recommendedSupplier,
    suggestedSuppliers,
  };
}

export function getMaterialInsight(
  state: AppState,
  nameOrId: string,
  materialId?: string,
  requiredQty = 0,
): MaterialInsight {
  const raw = findRawMaterial(state, materialId || nameOrId);
  if (raw) {
    const availability = Number(raw.quantity ?? 0);
    const threshold = Number(raw.threshold ?? 0);
    const unit = String(raw.unit ?? 'pcs');
    const inInventory = availability > 0;
    const insufficientForBom = requiredQty > 0 && availability < requiredQty;

    return buildInsightBase(
      {
        inInventory,
        availability,
        threshold,
        unit,
        stockStatus: resolveStockStatus(availability, threshold),
        lastPrice: Number(raw.price ?? 0),
        category: String(raw.category ?? 'Raw Materials'),
        code: String(raw.id),
        requiredQty,
        insufficientForBom,
      },
      raw,
      requiredQty,
      state,
    );
  }

  const inv = findInventoryMaterial(state, nameOrId);
  if (inv) {
    const availability = Number(inv.stock ?? 0);
    const threshold = Number(inv.minStock ?? inv.reorderLevel ?? 0);
    const unit = String(inv.uom ?? 'pcs');
    const inInventory = availability > 0;
    const insufficientForBom = requiredQty > 0 && availability < requiredQty;

    return buildInsightBase(
      {
        inInventory,
        availability,
        threshold,
        unit,
        stockStatus: resolveStockStatus(availability, threshold),
        lastPrice: Number(inv.cost ?? inv.price ?? 0),
        category: String(inv.category ?? 'Inventory'),
        code: String(inv.sku ?? inv.id),
        requiredQty,
        insufficientForBom,
      },
      null,
      requiredQty,
      state,
    );
  }

  return buildInsightBase(
    {
      inInventory: false,
      availability: 0,
      threshold: 0,
      unit: 'pcs',
      stockStatus: 'unknown',
      lastPrice: 0,
      category: 'General',
      code: '',
      requiredQty,
      insufficientForBom: requiredQty > 0,
    },
    null,
    requiredQty,
    state,
  );
}

export function listRecipes(state: AppState): Recipe[] {
  return listFromState(state, 'recipes').map(normalizeRecipe);
}

function normalizeRecipe(row: Row): Recipe {
  const materials = Array.isArray(row.materials)
    ? (row.materials as Row[]).map((m) => buildBomMaterial(m as Partial<BomMaterial> & { name: string; unit: string }))
    : [];
  const id = String(row.id ?? row.recipeNumber ?? '');
  const model = String(row.model ?? row.productSku ?? '');
  return {
    id,
    recipeNumber: String(row.recipeNumber ?? id),
    product: String(row.product ?? ''),
    model,
    version: String(row.version ?? 'v1.0'),
    productSku: String(row.productSku ?? model),
    productId: row.productId as string | number | undefined,
    status: (row.status === 'inactive' ? 'inactive' : 'active') as Recipe['status'],
    materials,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function getRecipe(state: AppState, id: string): Recipe | null {
  return listRecipes(state).find((r) => r.id === id || r.recipeNumber === id) ?? null;
}

export function getRecipeMetrics(recipes: Recipe[]) {
  const active = recipes.filter((r) => r.status === 'active').length;
  const costs = recipes.map((r) => r.materials.reduce((s, m) => s + m.costPerProduct, 0));
  const avgCost = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
  return { total: recipes.length, active, avgCost };
}

export function getRecipeBomCost(recipe: Recipe) {
  return Number(recipe.materials.reduce((s, m) => s + m.costPerProduct, 0).toFixed(2));
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

export type ProductionPlanLine = {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  qtyPerProduct: number;
  effectiveQtyPerProduct: number;
  requiredQty: number;
  unitCost: number;
  lineCost: number;
  inStockQty: number;
  shortfallQty: number;
  insight: MaterialInsight;
};

export type ProductionPlanSummary = {
  batchQty: number;
  totalMaterials: number;
  materialsFullyInStock: number;
  materialsShort: number;
  totalLineCost: number;
  estimatedPurchaseForShortfall: number;
};

function estimateShortfallCost(shortfallQty: number, insight: MaterialInsight, unitCost: number): number {
  if (shortfallQty <= 0) return 0;
  const bestPrice = insight.supplierOffers[0]?.price ?? insight.lastPrice ?? unitCost;
  return Number((shortfallQty * bestPrice).toFixed(2));
}

export function getProductionPlan(state: AppState, recipe: Recipe, batchQty: number): {
  lines: ProductionPlanLine[];
  summary: ProductionPlanSummary;
} {
  const qty = Math.max(0, batchQty);
  const lines: ProductionPlanLine[] = recipe.materials.map((material) => {
    const requiredQty = Number((material.effectiveQty * qty).toFixed(2));
    const insight = getMaterialInsight(state, material.name, material.materialId, requiredQty);
    const inStockQty = insight.availability;
    const shortfallQty = Math.max(0, Number((requiredQty - inStockQty).toFixed(2)));

    return {
      materialId: material.materialId,
      name: material.name,
      category: material.category,
      unit: material.unit,
      qtyPerProduct: material.qtyPerProduct,
      effectiveQtyPerProduct: material.effectiveQty,
      requiredQty,
      unitCost: material.standardCost,
      lineCost: Number((material.costPerProduct * qty).toFixed(2)),
      inStockQty,
      shortfallQty,
      insight,
    };
  });

  const materialsFullyInStock = lines.filter((l) => l.shortfallQty === 0).length;
  const materialsShort = lines.filter((l) => l.shortfallQty > 0).length;
  const totalLineCost = Number(lines.reduce((s, l) => s + l.lineCost, 0).toFixed(2));
  const estimatedPurchaseForShortfall = Number(
    lines.reduce((s, l) => s + estimateShortfallCost(l.shortfallQty, l.insight, l.unitCost), 0).toFixed(2),
  );

  return {
    lines,
    summary: {
      batchQty: qty,
      totalMaterials: lines.length,
      materialsFullyInStock,
      materialsShort,
      totalLineCost,
      estimatedPurchaseForShortfall,
    },
  };
}

export type ProductRecipeLookup = {
  id?: string | number;
  sku?: string;
  name?: string;
};

export function findRecipeForProduct(state: AppState, product: ProductRecipeLookup): Recipe | null {
  const id = String(product.id ?? '').trim();
  const sku = String(product.sku ?? '').trim();
  const name = String(product.name ?? '').trim().toLowerCase();

  const activeRecipes = listRecipes(state).filter((recipe) => recipe.status === 'active');

  return activeRecipes.find((recipe) => {
    const model = recipe.model.trim();
    const productSku = recipe.productSku.trim();
    const recipeProduct = recipe.product.trim().toLowerCase();
    const recipeProductId = recipe.productId != null ? String(recipe.productId) : '';

    if (sku && (model === sku || productSku === sku)) return true;
    if (id && (model === id || productSku === id || recipeProductId === id)) return true;
    if (name && recipeProduct === name) return true;
    return false;
  }) ?? null;
}

/** Prefer explicit recipeId on inventory rows; fall back to SKU/name heuristic. */
export function resolveRecipeForInventoryRow(
  state: AppState,
  row: ProductRecipeLookup & { recipeId?: string | number },
): Recipe | null {
  const recipeId = String(row.recipeId ?? '').trim();
  if (recipeId) {
    const linked = getRecipe(state, recipeId);
    if (linked) return linked;
  }
  return findRecipeForProduct(state, row);
}

export type ProductionCapacityLine = {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  qtyPerProduct: number;
  effectiveQtyPerProduct: number;
  availableQty: number;
  maxUnitsFromMaterial: number;
  usedAtMax: number;
  surplusAfterMax: number;
  isLimiting: boolean;
  insight: MaterialInsight;
};

export type ProductionCapacityReport = {
  recipe: Recipe;
  currentStockQty: number;
  maxProducibleUnits: number;
  limitingMaterialName: string;
  totalPossibleUnits: number;
  lines: ProductionCapacityLine[];
};

export function getProductionCapacityReport(
  state: AppState,
  recipe: Recipe,
  currentStockQty: number,
): ProductionCapacityReport {
  const stockQty = Math.max(0, currentStockQty);

  if (!recipe.materials.length) {
    return {
      recipe,
      currentStockQty: stockQty,
      maxProducibleUnits: 0,
      limitingMaterialName: '—',
      totalPossibleUnits: stockQty,
      lines: [],
    };
  }

  const draftLines = recipe.materials.map((material) => {
    const insight = getMaterialInsight(state, material.name, material.materialId, 0);
    const availableQty = insight.availability;
    const effectiveQtyPerProduct = material.effectiveQty;
    const maxUnitsFromMaterial = effectiveQtyPerProduct > 0
      ? Math.floor(availableQty / effectiveQtyPerProduct)
      : 0;

    return {
      materialId: material.materialId,
      name: material.name,
      category: material.category,
      unit: material.unit,
      qtyPerProduct: material.qtyPerProduct,
      effectiveQtyPerProduct,
      availableQty,
      maxUnitsFromMaterial,
      usedAtMax: 0,
      surplusAfterMax: availableQty,
      isLimiting: false,
      insight,
    };
  });

  const maxProducibleUnits = draftLines.reduce(
    (min, line) => Math.min(min, line.maxUnitsFromMaterial),
    Number.POSITIVE_INFINITY,
  );
  const safeMax = Number.isFinite(maxProducibleUnits) ? Math.max(0, maxProducibleUnits) : 0;
  const limitingLine = draftLines.find((line) => line.maxUnitsFromMaterial === safeMax) ?? draftLines[0];

  const lines: ProductionCapacityLine[] = draftLines.map((line) => {
    const usedAtMax = Number((line.effectiveQtyPerProduct * safeMax).toFixed(2));
    const surplusAfterMax = Number(Math.max(0, line.availableQty - usedAtMax).toFixed(2));
    return {
      ...line,
      usedAtMax,
      surplusAfterMax,
      isLimiting: line.materialId === limitingLine?.materialId && line.name === limitingLine?.name,
    };
  });

  return {
    recipe,
    currentStockQty: stockQty,
    maxProducibleUnits: safeMax,
    limitingMaterialName: limitingLine?.name ?? '—',
    totalPossibleUnits: stockQty + safeMax,
    lines,
  };
}

export type ProductionWhatIfLine = ProductionCapacityLine & {
  totalRequiredForTarget: number;
  shortageForTarget: number;
  surplusForTarget: number;
  remainingAfterMaxProduction: number;
  hasShortage: boolean;
};

export type ProductionPurchaseShortage = {
  materialId: string;
  name: string;
  qty: number;
  unit: string;
};

export type ProductionWhatIfAnalysis = {
  capacity: ProductionCapacityReport;
  targetQty: number;
  achievableQty: number;
  shortfallUnits: number;
  afterProductionStock: number;
  totalPotentialStock: number;
  lines: ProductionWhatIfLine[];
  purchaseShortages: ProductionPurchaseShortage[];
};

export function getProductionWhatIfAnalysis(
  state: AppState,
  recipe: Recipe,
  currentStockQty: number,
  targetQty: number,
): ProductionWhatIfAnalysis {
  const capacity = getProductionCapacityReport(state, recipe, currentStockQty);
  const safeTarget = Math.max(1, Math.floor(Number(targetQty) || 0));
  const achievableQty = Math.min(safeTarget, capacity.maxProducibleUnits);
  const shortfallUnits = Math.max(0, safeTarget - capacity.maxProducibleUnits);
  const afterProductionStock = capacity.currentStockQty + achievableQty;
  const totalPotentialStock = capacity.currentStockQty + capacity.maxProducibleUnits;

  const lines: ProductionWhatIfLine[] = capacity.lines.map((line) => {
    const totalRequiredForTarget = Number((line.effectiveQtyPerProduct * safeTarget).toFixed(2));
    const shortageForTarget = Number(Math.max(0, totalRequiredForTarget - line.availableQty).toFixed(2));
    const surplusForTarget = Number(Math.max(0, line.availableQty - totalRequiredForTarget).toFixed(2));
    return {
      ...line,
      totalRequiredForTarget,
      shortageForTarget,
      surplusForTarget,
      remainingAfterMaxProduction: line.surplusAfterMax,
      hasShortage: shortageForTarget > 0,
    };
  });

  const purchaseShortages: ProductionPurchaseShortage[] = lines
    .filter((line) => line.shortageForTarget > 0)
    .map((line) => ({
      materialId: line.materialId,
      name: line.name,
      qty: line.shortageForTarget,
      unit: line.unit,
    }));

  return {
    capacity,
    targetQty: safeTarget,
    achievableQty,
    shortfallUnits,
    afterProductionStock,
    totalPotentialStock,
    lines,
    purchaseShortages,
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
    threshold: Number(r.threshold ?? 0),
    supplierId: String(r.supplierId ?? ''),
  }));

  const fromInv = inventory.map((p) => ({
    id: `inv-${p.id}`,
    name: String(p.name ?? ''),
    category: String(p.category ?? 'Inventory'),
    unit: String(p.uom ?? 'pcs'),
    standardCost: Number(p.cost ?? p.price ?? 0),
    availability: Number(p.stock ?? 0),
    code: String(p.sku ?? p.id),
    threshold: Number(p.minStock ?? p.reorderLevel ?? 0),
  }));

  const seen = new Set<string>();
  return [...fromRaw, ...fromInv].filter((m) => {
    const key = m.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return m.name.length > 0;
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
  payload: { product: string; model: string; recipeNumber?: string; status?: string; notes?: string },
) {
  const model = payload.model.trim();
  const product = payload.product.trim();
  if (!product || !model) return { ok: false as const, error: 'Product name and model are required' };

  const existing = listRecipes(state).find((r) => r.model.toLowerCase() === model.toLowerCase());
  if (existing) return { ok: false as const, error: 'A recipe already exists for this model' };

  const recipeNumber = payload.recipeNumber?.trim() || nextRecipeId(state);
  const duplicateNumber = listRecipes(state).find((r) => r.recipeNumber === recipeNumber);
  if (duplicateNumber) return { ok: false as const, error: 'Recipe number already in use' };

  return createInState(state, 'recipes', {
    id: recipeNumber,
    recipeNumber,
    product,
    model,
    productSku: model,
    version: 'v1.0',
    status: payload.status ?? 'active',
    materials: [],
    notes: payload.notes ?? '',
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

export function reorderMaterialInRecipe(state: AppState, recipeId: string, materialId: string, direction: 'up' | 'down') {
  const recipe = getRecipe(state, recipeId);
  if (!recipe) return { ok: false as const, error: 'Recipe not found' };
  const idx = recipe.materials.findIndex((m) => m.id === materialId);
  if (idx < 0) return { ok: false as const, error: 'Material not found' };
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= recipe.materials.length) return { ok: true as const };
  const materials = [...recipe.materials];
  [materials[idx], materials[swapIdx]] = [materials[swapIdx], materials[idx]];
  return updateInState(state, 'recipes', recipeId, { materials });
}

export { formatCurrency as formatMoney };
