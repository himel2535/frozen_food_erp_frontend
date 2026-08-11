import type { AppState } from '@/lib/state/types';
import { listInventory, computeTotalStock } from '@/lib/services/inventory-service';
import type { PosCartItem, PosCategoryId, PosDraft, PosHeldSale, PosProduct } from './pos-types';

export const POS_CATEGORIES: { id: PosCategoryId; labelKey: string; fallback: string }[] = [
  { id: 'all', labelKey: 'sales.pos_all_categories', fallback: 'All Categories' },
  { id: 'toys', labelKey: 'sales.pos_cat_toys', fallback: 'Toys' },
  { id: 'figures', labelKey: 'sales.pos_cat_figures', fallback: 'Figures' },
  { id: 'games', labelKey: 'sales.pos_cat_games', fallback: 'Games' },
  { id: 'vehicles', labelKey: 'sales.pos_cat_vehicles', fallback: 'Vehicles' },
  { id: 'puzzles', labelKey: 'sales.pos_cat_puzzles', fallback: 'Puzzles' },
  { id: 'others', labelKey: 'sales.pos_cat_others', fallback: 'Others' },
];

const CATEGORY_VISUALS: Record<Exclude<PosCategoryId, 'all'>, { emoji: string; gradient: string }> = {
  toys: { emoji: '🧸', gradient: 'from-rose-100 via-orange-50 to-amber-100' },
  figures: { emoji: '🦸', gradient: 'from-violet-100 via-purple-50 to-fuchsia-100' },
  games: { emoji: '🎲', gradient: 'from-emerald-100 via-teal-50 to-cyan-100' },
  vehicles: { emoji: '🚗', gradient: 'from-sky-100 via-blue-50 to-indigo-100' },
  puzzles: { emoji: '🧩', gradient: 'from-lime-100 via-green-50 to-emerald-100' },
  others: { emoji: '🎁', gradient: 'from-slate-100 via-zinc-50 to-stone-100' },
};

const DEMO_CATALOG: Omit<PosProduct, 'id'>[] = [
  { name: 'Premium Teddy Bear', sku: 'SKU-PLUSH-001', price: 850, stock: 120, category: 'toys', imageEmoji: '🧸', imageGradient: CATEGORY_VISUALS.toys.gradient, isDemo: true },
  { name: 'Remote Control Car', sku: 'SKU-RC-002', price: 1200, stock: 45, category: 'vehicles', imageEmoji: '🚗', imageGradient: CATEGORY_VISUALS.vehicles.gradient, isDemo: true },
  { name: 'Action Figure Set', sku: 'SKU-FIG-003', price: 650, stock: 80, category: 'figures', imageEmoji: '🦸', imageGradient: CATEGORY_VISUALS.figures.gradient, isDemo: true },
  { name: 'Board Game Classic', sku: 'SKU-GAME-004', price: 450, stock: 200, category: 'games', imageEmoji: '🎲', imageGradient: CATEGORY_VISUALS.games.gradient, isDemo: true },
  { name: 'Puzzle 1000pcs', sku: 'SKU-PUZ-005', price: 320, stock: 150, category: 'puzzles', imageEmoji: '🧩', imageGradient: CATEGORY_VISUALS.puzzles.gradient, isDemo: true },
  { name: 'Building Blocks Set', sku: 'SKU-BLK-006', price: 550, stock: 90, category: 'toys', imageEmoji: '🧱', imageGradient: CATEGORY_VISUALS.toys.gradient, isDemo: true },
  { name: 'Doll House Mini', sku: 'SKU-DOLL-007', price: 980, stock: 35, category: 'toys', imageEmoji: '🏠', imageGradient: CATEGORY_VISUALS.toys.gradient, isDemo: true },
  { name: 'Soft Ball Set', sku: 'SKU-BALL-008', price: 280, stock: 300, category: 'others', imageEmoji: '⚽', imageGradient: CATEGORY_VISUALS.others.gradient, isDemo: true },
  { name: 'Toy Train Set', sku: 'SKU-TRN-009', price: 1450, stock: 25, category: 'vehicles', imageEmoji: '🚂', imageGradient: CATEGORY_VISUALS.vehicles.gradient, isDemo: true },
  { name: 'Stuffed Rabbit', sku: 'SKU-PLUSH-010', price: 720, stock: 60, category: 'toys', imageEmoji: '🐰', imageGradient: CATEGORY_VISUALS.toys.gradient, isDemo: true },
];

const HOLDS_KEY = 'hookerp_pos_holds';
const DRAFT_KEY = 'hookerp_pos_draft';

function resolveCategory(name: string, category: string, productType: string): Exclude<PosCategoryId, 'all'> {
  const hay = `${name} ${category} ${productType}`.toLowerCase();
  if (hay.includes('figure') || hay.includes('hero') || hay.includes('doll')) return 'figures';
  if (hay.includes('puzzle')) return 'puzzles';
  if (hay.includes('game') || hay.includes('board')) return 'games';
  if (hay.includes('car') || hay.includes('vehicle') || hay.includes('rc') || hay.includes('train')) return 'vehicles';
  if (hay.includes('toy') || hay.includes('plush') || hay.includes('bear') || hay.includes('block')) return 'toys';
  if (hay.includes('raw') || hay.includes('pellet') || hay.includes('dye') || hay.includes('part')) return 'others';
  return 'others';
}

function rowToPosProduct(row: Record<string, unknown>): PosProduct {
  const category = resolveCategory(String(row.name ?? ''), String(row.category ?? ''), String(row.productType ?? ''));
  const visuals = CATEGORY_VISUALS[category];
  return {
    id: String(row.id ?? row.sku),
    name: String(row.name ?? 'Product'),
    sku: String(row.sku ?? ''),
    price: Number(row.price ?? 0),
    stock: computeTotalStock(row),
    category,
    imageEmoji: visuals.emoji,
    imageGradient: visuals.gradient,
    imageUrl: String(row.imageUrl ?? ''),
  };
}

export function listPosProducts(state: AppState): PosProduct[] {
  const inventoryRows = listInventory(state, { excludeRaw: true }).filter((row) => !row.discontinued);
  const bySku = new Map<string, PosProduct>();

  inventoryRows.forEach((row) => {
    const product = rowToPosProduct(row as Record<string, unknown>);
    if (product.price > 0) bySku.set(product.sku.toLowerCase(), product);
  });

  DEMO_CATALOG.forEach((demo, index) => {
    const key = demo.sku.toLowerCase();
    if (!bySku.has(key)) {
      bySku.set(key, { ...demo, id: `demo-${index + 1}` });
    }
  });

  return Array.from(bySku.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function filterPosProducts(products: PosProduct[], search: string, category: PosCategoryId): PosProduct[] {
  const q = search.trim().toLowerCase();
  return products.filter((product) => {
    if (category !== 'all' && product.category !== category) return false;
    if (!q) return true;
    return `${product.name} ${product.sku}`.toLowerCase().includes(q);
  });
}

export function calcPosTotals(cart: PosCartItem[], discount: number, taxRate: number) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const taxable = Math.max(0, subtotal - safeDiscount);
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax;
  return { subtotal, discount: safeDiscount, tax, total };
}

export function loadPosHolds(): PosHeldSale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HOLDS_KEY);
    return raw ? (JSON.parse(raw) as PosHeldSale[]) : [];
  } catch {
    return [];
  }
}

export function savePosHolds(holds: PosHeldSale[]) {
  localStorage.setItem(HOLDS_KEY, JSON.stringify(holds.slice(0, 12)));
}

export function loadPosDraft(): PosDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PosDraft) : null;
  } catch {
    return null;
  }
}

export function savePosDraft(draft: PosDraft | null) {
  if (!draft || draft.cart.length === 0) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function cartItemCount(cart: PosCartItem[]) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}
