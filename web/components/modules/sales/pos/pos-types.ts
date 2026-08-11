export type PosCategoryId = 'all' | 'toys' | 'figures' | 'games' | 'vehicles' | 'puzzles' | 'others';

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: PosCategoryId;
  imageEmoji: string;
  imageGradient: string;
  imageUrl?: string;
  isDemo?: boolean;
}

export interface PosCartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  imageEmoji: string;
  imageGradient: string;
  imageUrl?: string;
}

export interface PosHeldSale {
  id: string;
  label: string;
  savedAt: string;
  customerId: string;
  customerName: string;
  cart: PosCartItem[];
  discount: number;
  note: string;
  taxRate: number;
}

export interface PosDraft {
  customerId: string;
  customerName: string;
  cart: PosCartItem[];
  discount: number;
  note: string;
  taxRate: number;
}
