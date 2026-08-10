'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { posCheckout } from '@/lib/services/sales-service';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export function PosPage() {
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const { formatMoney, formatNumber } = useLocaleFormat();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState('');

  const defaultCustomer = t('sales.pos_walk_in');
  const customerValue = customer || defaultCustomer;

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
          name: String(product.name ?? t('common.product')),
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
      toast.error('Action required', { module: 'POS', description: t('sales.pos_empty_cart') });
      return;
    }
    const result = posCheckout(appState, { customer: customerValue, cart: cart as unknown as Record<string, unknown>[], total: cartTotal });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'POS', description: 'error' in result ? String(result.error) : 'Checkout failed' });
      return;
    }
    saveAppState();
    setCart([]);
    toast.info('Notice', { module: 'POS', description: `${result.id} · ${formatMoney(cartTotal)}` });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder={t('sales.pos_search_placeholder')}
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
                <p className="text-xs text-blue-600 font-semibold mt-1">{formatMoney(Number(product.price ?? 0))}</p>
                <p className="text-[10px] text-slate-500">{t('sales.pos_stock')}: {formatNumber(Number(product.stock ?? 0))}</p>
              </button>
            ))}
            {products.length === 0 && (
              <p className="col-span-full text-xs text-slate-400 text-center py-8">{t('sales.pos_no_products')}</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">{t('sales.pos_cart')} ({cart.length})</h2>
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-semibold text-slate-500">{t('sales.pos_customer')}</label>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder={defaultCustomer}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-xs"
            />
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-64">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-xs border-b border-slate-100 pb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{t('sales.pos_each', { amount: formatMoney(item.price) })}</p>
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
            {cart.length === 0 && <p className="text-xs text-slate-400 text-center py-6">{t('sales.pos_empty_cart')}</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between text-sm font-bold text-slate-800 mb-3">
              <span>{t('sales.col_total')}</span>
              <span>{formatMoney(cartTotal)}</span>
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 rounded-xl cursor-pointer"
            >
              {t('sales.pos_complete_sale')}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
