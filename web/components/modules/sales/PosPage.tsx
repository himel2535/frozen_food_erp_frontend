'use client';

import { toast, confirmAction, promptAction } from '@/lib/ui/feedback';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Clock3,
  PauseCircle,
  Percent,
  Plus,
  Printer,
  ScanLine,
  Settings2,
} from 'lucide-react';
import { loadIcons } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PosCartPanel } from '@/components/modules/sales/pos/PosCartPanel';
import { PosProductPanel } from '@/components/modules/sales/pos/PosProductPanel';
import type { PosCartItem, PosCategoryId, PosProduct } from '@/components/modules/sales/pos/pos-types';
import { printPosReceipt } from '@/components/modules/sales/pos/pos-receipt';
import { posQuickActionClass } from '@/components/modules/sales/pos/pos-styles';
import {
  calcPosTotals,
  cartItemCount,
  filterPosProducts,
  listPosProducts,
  loadPosDraft,
  loadPosHolds,
  savePosDraft,
  savePosHolds,
} from '@/components/modules/sales/pos/pos-utils';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { getCustomerList } from '@/lib/services/crm-service';
import { posCheckout } from '@/lib/services/sales-service';
import { MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
import { getPageIcon } from '@/lib/ui/page-icons';

const DEFAULT_TAX_RATE = 5;

export function PosPage() {
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const { formatMoney, formatNumber } = useLocaleFormat();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PosCategoryId>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerId, setCustomerId] = useState('walk-in');
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const [taxRate, setTaxRate] = useState(DEFAULT_TAX_RATE);
  const [holds, setHolds] = useState(loadPosHolds);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null);

  useEffect(() => {
    loadIcons([getPageIcon('/sales/pos')]);
  }, []);

  const labels = useMemo(
    () => ({
      searchPlaceholder: t('sales.pos_search_placeholder'),
      gridView: t('sales.pos_grid_view'),
      listView: t('sales.pos_list_view'),
      inStock: t('sales.pos_in_stock'),
      add: t('sales.pos_add'),
      noProducts: t('sales.pos_no_products'),
      currentSale: t('sales.pos_current_sale'),
      items: t('sales.pos_items'),
      customer: t('sales.pos_customer'),
      walkIn: t('sales.pos_walk_in'),
      clearCart: t('sales.pos_clear_cart'),
      emptyCart: t('sales.pos_empty_cart'),
      addDiscount: t('sales.pos_add_discount'),
      addNote: t('sales.pos_add_note'),
      note: t('sales.pos_note'),
      subtotal: t('sales.pos_subtotal'),
      discount: t('sales.pos_discount'),
      tax: t('sales.pos_tax_vat', { n: taxRate }),
      total: t('sales.pos_total'),
      completeSale: t('sales.pos_complete_sale'),
      saveDraft: t('sales.pos_save_draft'),
      moreOptions: t('sales.pos_more_options'),
      allCategories: t('sales.pos_all_categories'),
      catToys: t('sales.pos_cat_toys'),
      catFigures: t('sales.pos_cat_figures'),
      catGames: t('sales.pos_cat_games'),
      catVehicles: t('sales.pos_cat_vehicles'),
      catPuzzles: t('sales.pos_cat_puzzles'),
      catOthers: t('sales.pos_cat_others'),
    }),
    [t, taxRate],
  );

  const products = useMemo(() => listPosProducts(appState), [appState]);
  const filteredProducts = useMemo(
    () => filterPosProducts(products, search, category),
    [products, search, category],
  );
  const customers = useMemo(
    () => getCustomerList(appState).map((c) => ({ id: String(c.id), name: String(c.name ?? c.company ?? 'Customer') })),
    [appState],
  );
  const customerName = useMemo(() => {
    if (customerId === 'walk-in') return t('sales.pos_walk_in');
    return customers.find((c) => c.id === customerId)?.name ?? t('sales.pos_walk_in');
  }, [customerId, customers, t]);

  const totals = useMemo(() => calcPosTotals(cart, discount, taxRate), [cart, discount, taxRate]);
  const itemCount = cartItemCount(cart);

  const resetSale = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setNote('');
    setCustomerId('walk-in');
    savePosDraft(null);
  }, []);

  const addToCart = useCallback((product: PosProduct) => {
    if (product.stock <= 0) {
      toast.error('Out of stock', { module: 'POS', description: product.name });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.info('Stock limit reached', { module: 'POS', description: product.name });
          return prev;
        }
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: 1,
          imageEmoji: product.imageEmoji,
          imageGradient: product.imageGradient,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((item) => item.id !== id);
      const product = products.find((p) => p.id === id);
      const capped = product ? Math.min(qty, product.stock) : qty;
      return prev.map((item) => (item.id === id ? { ...item, qty: capped } : item));
    });
  }, [products]);

  const completeSale = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Action required', { module: 'POS', description: t('sales.pos_empty_cart') });
      return;
    }
    const result = posCheckout(appState, {
      customer: customerName,
      customerId: customerId === 'walk-in' ? undefined : customerId,
      cart: cart as unknown as Record<string, unknown>[],
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      note,
      taxRate,
    });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'POS', description: 'error' in result ? String(result.error) : 'Checkout failed' });
      return;
    }
    saveAppState();
    setLastReceiptId(result.id);
    resetSale();
    toast.success('Sale completed', { module: 'POS', description: `${result.id} · ${formatMoney(totals.total)}` });
  }, [appState, cart, customerId, customerName, formatMoney, note, resetSale, saveAppState, t, taxRate, totals]);

  const holdSale = useCallback(() => {
    if (cart.length === 0) {
      toast.info('Nothing to hold', { module: 'POS', description: t('sales.pos_empty_cart') });
      return;
    }
    const nextHold = {
      id: `HOLD-${Date.now()}`,
      label: `${customerName} · ${itemCount} items`,
      savedAt: new Date().toISOString(),
      customerId,
      customerName,
      cart,
      discount,
      note,
      taxRate,
    };
    const next = [nextHold, ...holds].slice(0, 12);
    setHolds(next);
    savePosHolds(next);
    resetSale();
    toast.success('Sale held', { module: 'POS', description: nextHold.label });
  }, [cart, customerId, customerName, discount, holds, itemCount, note, resetSale, t, taxRate]);

  const restoreHold = useCallback(async () => {
    if (holds.length === 0) {
      toast.info('No held sales', { module: 'POS' });
      return;
    }
    const latest = holds[0];
    const ok = cart.length === 0 || await confirmAction({
      title: 'Restore held sale?',
      message: 'Current cart will be replaced.',
      confirmLabel: 'Restore',
      module: 'POS',
    });
    if (!ok) return;
    setCart(latest.cart);
    setCustomerId(latest.customerId);
    setDiscount(latest.discount);
    setNote(latest.note);
    setTaxRate(latest.taxRate);
    toast.success('Held sale restored', { module: 'POS', description: latest.label });
  }, [cart.length, holds]);

  const showRecentSales = useCallback(() => {
    const receipts = Array.isArray(appState.posReceipts) ? appState.posReceipts : [];
    if (receipts.length === 0) {
      toast.info('No recent POS sales yet', { module: 'POS' });
      return;
    }
    const lines = receipts.slice(0, 5).map((r) => `${String(r.receipt ?? r.id)} · ${formatMoney(Number(r.amount ?? 0))}`).join('\n');
    toast.info('Recent POS sales', { module: 'POS', description: lines });
  }, [appState.posReceipts, formatMoney]);

  const promptDiscount = useCallback(async () => {
    const raw = await promptAction(t('sales.pos_discount_prompt'), String(discount), {
      module: 'POS',
      inputType: 'number',
    });
    if (raw == null) return;
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) {
      toast.error('Invalid discount', { module: 'POS' });
      return;
    }
    setDiscount(value);
  }, [discount, t]);

  const promptNote = useCallback(async () => {
    const raw = await promptAction(t('sales.pos_note_prompt'), note, { module: 'POS' });
    if (raw == null) return;
    setNote(raw.trim());
  }, [note, t]);

  const promptTax = useCallback(async () => {
    const raw = await promptAction(t('sales.pos_tax_prompt'), String(taxRate), {
      module: 'POS',
      inputType: 'number',
    });
    if (raw == null) return;
    const value = Number(raw);
    if (!Number.isNaN(value) && value >= 0) setTaxRate(value);
  }, [taxRate, t]);

  const saveDraft = useCallback(() => {
    if (cart.length === 0) {
      toast.info('Nothing to save', { module: 'POS', description: 'Add items to cart first.' });
      return;
    }
    savePosDraft({ customerId, customerName, cart, discount, note, taxRate });
    toast.success('Draft saved', { module: 'POS' });
  }, [cart, customerId, customerName, discount, note, taxRate]);

  const reloadDraft = useCallback(() => {
    const draft = loadPosDraft();
    if (!draft || draft.cart.length === 0) {
      toast.info('No draft found', { module: 'POS' });
      return;
    }
    setCart(draft.cart);
    setCustomerId(draft.customerId);
    setDiscount(draft.discount);
    setNote(draft.note);
    setTaxRate(draft.taxRate);
    toast.success('Draft loaded', { module: 'POS' });
  }, []);

  const scanBarcode = useCallback((code: string) => {
    const q = code.trim().toLowerCase();
    if (!q) return;
    const match = products.find(
      (p) => p.sku.toLowerCase() === q || p.id.toLowerCase() === q || p.name.toLowerCase().includes(q),
    );
    if (!match) {
      toast.error('Product not found', { module: 'POS', description: code });
      return;
    }
    addToCart(match);
    setSearch('');
    toast.success('Product added', { module: 'POS', description: match.name });
  }, [addToCart, products]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    scanBarcode(search);
  }, [scanBarcode, search]);

  const startBarcodeScanner = useCallback(() => {
    setBarcodeMode(true);
    toast.info('Barcode scanner active', { module: 'POS', description: 'Scan or type SKU, then press Enter.' });
  }, []);

  const printReceipt = useCallback(() => {
    if (cart.length > 0) {
      const ok = printPosReceipt(
        {
          receiptId: lastReceiptId ?? `PREVIEW-${Date.now()}`,
          date: new Date().toLocaleString(),
          customer: customerName,
          items: cart,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          taxRate,
          total: totals.total,
          note,
        },
        formatMoney,
      );
      if (!ok) toast.error('Could not open print window', { module: 'POS' });
      return;
    }

    const receipts = Array.isArray(appState.posReceipts) ? appState.posReceipts : [];
    const latest = receipts[receipts.length - 1] as Record<string, unknown> | undefined;
    if (!latest) {
      toast.info('No receipt to print', { module: 'POS', description: 'Complete a sale or add items first.' });
      return;
    }

    const ok = printPosReceipt(
      {
        receiptId: String(latest.receipt ?? latest.id ?? 'RCPT'),
        date: String(latest.date ?? new Date().toLocaleString()),
        customer: String(latest.customer ?? customerName),
        items: (Array.isArray(latest.items) ? latest.items : []) as PosCartItem[],
        subtotal: Number(latest.subtotal ?? latest.amount ?? 0),
        discount: Number(latest.discount ?? 0),
        tax: Number(latest.tax ?? 0),
        taxRate: Number(latest.taxRate ?? taxRate),
        total: Number(latest.amount ?? latest.total ?? 0),
        note: String(latest.note ?? ''),
      },
      formatMoney,
    );
    if (!ok) toast.error('Could not open print window', { module: 'POS' });
  }, [appState.posReceipts, cart, customerName, formatMoney, lastReceiptId, note, taxRate, totals]);

  const openCashDrawer = useCallback(() => {
    toast.success('Cash drawer opened', { module: 'POS', description: 'Drawer signal sent to connected device.' });
  }, []);

  const handleMoreAction = useCallback((action: 'hold' | 'recent' | 'clear' | 'reload-draft' | 'reset-tax') => {
    if (action === 'hold') holdSale();
    else if (action === 'recent') showRecentSales();
    else if (action === 'reload-draft') reloadDraft();
    else if (action === 'reset-tax') {
      setTaxRate(DEFAULT_TAX_RATE);
      toast.success('Tax reset', { module: 'POS', description: `VAT ${DEFAULT_TAX_RATE}%` });
    } else if (action === 'clear') {
      if (cart.length === 0) {
        toast.info('Cart is already empty', { module: 'POS' });
        return;
      }
      void confirmAction({
        title: 'Clear cart?',
        message: 'All items will be removed from the current sale.',
        confirmLabel: 'Clear',
        tone: 'danger',
        module: 'POS',
      }).then((ok) => {
        if (ok) resetSale();
      });
    }
  }, [cart.length, holdSale, reloadDraft, resetSale, showRecentSales]);

  useEffect(() => {
    const draft = loadPosDraft();
    if (!draft || draft.cart.length === 0) return;
    setCart(draft.cart);
    setCustomerId(draft.customerId);
    setDiscount(draft.discount);
    setNote(draft.note);
    setTaxRate(draft.taxRate);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        completeSale();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [completeSale]);

  return (
    <>
      <PageHeader
        title={t('sales.pos_title')}
        subtitle={t('sales.pos_subtitle')}
        icon={getPageIcon('/sales/pos')}
        size="compact"
        className="mb-2 shrink-0"
        actions={
          <>
            <button type="button" onClick={holdSale} className={MODULE_SECONDARY_BTN}>
              <PauseCircle className="w-4 h-4" /> {t('sales.pos_hold_sale')}
            </button>
            <button type="button" onClick={showRecentSales} className={MODULE_SECONDARY_BTN}>
              <Clock3 className="w-4 h-4" /> {t('sales.pos_recent_sales')}
            </button>
            <button type="button" onClick={resetSale} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> {t('sales.pos_new_sale')}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3 flex-1 min-h-0">
        <PosProductPanel
          products={filteredProducts}
          search={search}
          category={category}
          viewMode={viewMode}
          barcodeMode={barcodeMode}
          formatMoney={formatMoney}
          formatNumber={formatNumber}
          labels={{
            ...labels,
            'sales.pos_all_categories': labels.allCategories,
            'sales.pos_cat_toys': labels.catToys,
            'sales.pos_cat_figures': labels.catFigures,
            'sales.pos_cat_games': labels.catGames,
            'sales.pos_cat_vehicles': labels.catVehicles,
            'sales.pos_cat_puzzles': labels.catPuzzles,
            'sales.pos_cat_others': labels.catOthers,
          }}
          onSearchChange={setSearch}
          onSearchKeyDown={handleSearchKeyDown}
          onCategoryChange={setCategory}
          onViewModeChange={setViewMode}
          onAdd={addToCart}
          onBarcodeClick={startBarcodeScanner}
        />

        <PosCartPanel
          cart={cart}
          itemCount={itemCount}
          customerId={customerId}
          customers={customers}
          discount={discount}
          note={note}
          totals={totals}
          formatMoney={formatMoney}
          labels={labels}
          onCustomerChange={setCustomerId}
          onQtyChange={updateQty}
          onRemove={(id) => updateQty(id, 0)}
          onClear={resetSale}
          onDiscountPrompt={promptDiscount}
          onNotePrompt={promptNote}
          onComplete={completeSale}
          onSaveDraft={saveDraft}
          onMoreAction={handleMoreAction}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
        <PosQuickAction index={0} icon={<ScanLine className="w-4 h-4" />} label={t('sales.pos_barcode_scanner')} onClick={startBarcodeScanner} active={barcodeMode} />
        <PosQuickAction index={1} icon={<Percent className="w-4 h-4" />} label={t('sales.pos_apply_discount')} onClick={promptDiscount} />
        <PosQuickAction index={2} icon={<Settings2 className="w-4 h-4" />} label={t('sales.pos_tax_settings')} onClick={promptTax} />
        <PosQuickAction index={3} icon={<Printer className="w-4 h-4" />} label={t('sales.pos_print_receipt')} onClick={printReceipt} />
        <PosQuickAction index={4} icon={<Banknote className="w-4 h-4" />} label={t('sales.pos_open_drawer')} onClick={openCashDrawer} />
      </div>

      {holds.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500">{t('sales.pos_held_sales')}:</span>
          {holds.slice(0, 3).map((hold) => (
            <button
              key={hold.id}
              type="button"
              onClick={() => {
                setCart(hold.cart);
                setCustomerId(hold.customerId);
                setDiscount(hold.discount);
                setNote(hold.note);
                setTaxRate(hold.taxRate);
                toast.success('Held sale loaded', { module: 'POS', description: hold.label });
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-800 cursor-pointer"
            >
              {hold.label}
            </button>
          ))}
          <button type="button" onClick={() => void restoreHold()} className="text-[11px] font-bold text-blue-700 cursor-pointer">
            {t('sales.pos_restore_latest')}
          </button>
        </div>
      ) : null}

      <Footer />
    </>
  );
}

function PosQuickAction({
  index,
  icon,
  label,
  onClick,
  active = false,
}: {
  index: number;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${posQuickActionClass(index)} ${active ? 'ring-2 ring-sky-300/70' : ''}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
