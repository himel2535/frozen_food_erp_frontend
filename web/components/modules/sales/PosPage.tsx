'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/lib/state/app-store';
import { posCheckout } from '@/lib/services/sales-service';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

function formatCurrency(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PosPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState('Walk-in Customer');

  const products = useMemo(() => {
    const inventory = Array.isArray(appState.inventory) ? appState.inventory : [];
    return inventory.filter((p) => {
      const hay = `${p.name} ${p.sku}`.toLowerCase();
      return !search || hay.includes(search.toLowerCase());
    });
  }, [appState.inventory, search]);

  const cartTotal = cart.reduce((s, item) => s + item.price * item.qty, 0);

  const addToCart = (product: Record<string, unknown>) => {
    const id = String(product.id ?? product.sku);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          id,
          name: String(product.name ?? 'Product'),
          sku: String(product.sku ?? ''),
          price: Number(product.price ?? 0),
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const checkout = () => {
    if (cart.length === 0) {
      toast.error('Action required', { module: 'POS', description: "Cart is empty" });
      return;
    }
    const result = posCheckout(appState, { customer, cart: cart as unknown as Record<string, unknown>[], total: cartTotal });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'POS', description: 'error' in result ? String(result.error) : 'Checkout failed' });
      return;
    }
    saveAppState();
    setCart([]);
    toast.info('Notice', { module: 'POS', description: `Sale complete! Order ${result.id} · ${formatCurrency(cartTotal)}` });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Point of Sale</h1>
        <p className="text-xs text-slate-500 mt-0.5">Quick checkout terminal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => (
              <button
                key={String(product.id ?? product.sku)}
                type="button"
                onClick={() => addToCart(product as Record<string, unknown>)}
                className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 truncate">{String(product.name)}</p>
                <p className="text-[10px] text-slate-400">{String(product.sku ?? '')}</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">{formatCurrency(Number(product.price ?? 0))}</p>
                <p className="text-[10px] text-slate-500">Stock: {String(product.stock ?? 0)}</p>
              </button>
            ))}
            {products.length === 0 && (
              <p className="col-span-full text-xs text-slate-400 text-center py-8">No products found</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">Cart ({cart.length})</h2>
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-500">Customer</label>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
            />
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-64">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs border-b border-slate-100 pb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{formatCurrency(item.price)} each</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => updateQty(item.id, Number(e.target.value))}
                  className="w-12 px-1 py-1 border border-slate-200 rounded text-center"
                />
                <button type="button" onClick={() => updateQty(item.id, 0)} className="text-rose-500 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {cart.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Cart is empty</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between text-sm font-bold text-slate-800 mb-3">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 rounded-xl cursor-pointer"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
