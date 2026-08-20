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
  X,
} from 'lucide-react';
import { loadIcons } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PosCartPanel } from '@/components/modules/sales/pos/PosCartPanel';
import { PosPageSkeleton } from '@/components/modules/sales/pos/PosPageSkeleton';
import { PosProductPanel } from '@/components/modules/sales/pos/PosProductPanel';
import { PosReceiptView } from '@/components/modules/sales/pos/PosReceiptView';
import type { PosCartItem, PosCategoryId, PosProduct } from '@/components/modules/sales/pos/pos-types';
import {
  printPosReceipt,
  receiptFromPosRecord,
  type PosReceiptCompany,
  type PosReceiptData,
} from '@/components/modules/sales/pos/pos-receipt';
import { posQuickActionClass } from '@/components/modules/sales/pos/pos-styles';
import {
  calcPosTotals,
  cartItemCount,
  filterPosProducts,
  listPosProducts,
  loadPosDraft,
  loadPosHolds,
  mapRowsToPosProducts,
  savePosDraft,
  savePosHolds,
} from '@/components/modules/sales/pos/pos-utils';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { useCustomersApiStore } from '@/hooks/use-customers-module';
import { mapApiPosRow, mapApiProductRow, mapPosToApi } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { getCompanyProfile } from '@/lib/services/settings-service';
import { MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';
import { getPageIcon } from '@/lib/ui/page-icons';

const DEFAULT_TAX_RATE = 5;

type PosView = 'terminal' | 'receipt';

function buildCompanyInfo(appState: Parameters<typeof getCompanyProfile>[0]): PosReceiptCompany {
  const profile = getCompanyProfile(appState);
  const address = [profile.street, profile.city, profile.state, profile.postalCode, profile.country]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ');
  return {
    name: profile.name || 'Food Fun Agro Foods',
    address: address || undefined,
    phone: profile.phone || undefined,
    email: profile.email || undefined,
    taxId: profile.taxId || profile.vatNumber || undefined,
  };
}

export function PosPage() {
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const { formatMoney, formatNumber } = useLocaleFormat();
  const productsStore = usePaginatedApiResource('products', mapApiProductRow, { pageSize: 50 });
  const customersStore = useCustomersApiStore();
  const apiStore = usePaginatedApiResource('pos', mapApiPosRow, { pageSize: 20 });

  const [posView, setPosView] = useState<PosView>('terminal');
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
  const [lastCompletedReceipt, setLastCompletedReceipt] = useState<PosReceiptData | null>(null);
  const [showRecentPanel, setShowRecentPanel] = useState(false);
  const [showHoldPanel, setShowHoldPanel] = useState(false);

  useEffect(() => {
    loadIcons([getPageIcon('/sales/pos')]);
  }, []);

  const companyInfo = useMemo(() => buildCompanyInfo(appState), [appState]);

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

  const products = useMemo(() => {
    const fromApi = mapRowsToPosProducts(productsStore.rows);
    if (fromApi.length > 0) return fromApi;
    return listPosProducts(appState);
  }, [productsStore.rows, appState]);

  useEffect(() => {
    if (!productsStore.enabled) return;
    productsStore.setQueryFilter('posCategory', category);
  }, [category, productsStore.enabled, productsStore.setQueryFilter]);

  const filteredProducts = useMemo(() => {
    if (productsStore.enabled) {
      const q = productsStore.search.trim().toLowerCase();
      if (!q) return products;
      return products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(q));
    }
    return filterPosProducts(products, search, category);
  }, [products, search, category, productsStore.enabled, productsStore.search]);
  const customers = useMemo(
    () => customersStore.rows.map((c) => ({
      id: String(c.id),
      name: String(c.name ?? c.company ?? 'Customer'),
    })),
    [customersStore.rows],
  );
  const customerName = useMemo(() => {
    if (customerId === 'walk-in') return t('sales.pos_walk_in');
    return customers.find((c) => c.id === customerId)?.name ?? t('sales.pos_walk_in');
  }, [customerId, customers, t]);

  const totals = useMemo(() => calcPosTotals(cart, discount, taxRate), [cart, discount, taxRate]);
  const itemCount = cartItemCount(cart);

  const recentReceipts = useMemo(() => {
    return apiStore.rows
      .slice()
      .sort((a, b) => String(b.createdAt ?? b.date ?? '').localeCompare(String(a.createdAt ?? a.date ?? '')))
      .slice(0, 10)
      .map((row) => receiptFromPosRecord(row, { company: companyInfo, taxRate }));
  }, [apiStore.rows, companyInfo, taxRate]);

  const resetSale = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setNote('');
    setCustomerId('walk-in');
    savePosDraft(null);
  }, []);

  const startNewSale = useCallback(() => {
    setPosView('terminal');
    setShowRecentPanel(false);
    setShowHoldPanel(false);
    resetSale();
    toast.success('New sale started', { module: 'POS', description: 'Cart cleared — add products to begin.' });
  }, [resetSale]);

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
        const next = prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        return next;
      }
      const next = [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          qty: 1,
          imageEmoji: product.imageEmoji,
          imageGradient: product.imageGradient,
          imageUrl: product.imageUrl,
        },
      ];
      return next;
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

  const completeSale = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Action required', { module: 'POS', description: t('sales.pos_empty_cart') });
      return;
    }

    const body = mapPosToApi({
      customerName,
      customerId: customerId === 'walk-in' ? undefined : customerId,
      items: cart,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: 'cash',
      note,
      date: new Date().toISOString().slice(0, 10),
    });
    const result = await apiStore.create(body);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'POS', description: 'error' in result ? String(result.error) : 'Checkout failed' });
      return;
    }

    const receiptId = 'id' in result ? String(result.id) : `POS-${Date.now()}`;
    const now = new Date();
    const receiptData: PosReceiptData = {
      receiptId,
      date: now.toISOString().slice(0, 10),
      displayDate: now.toLocaleString(),
      customer: customerName,
      items: [...cart],
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      taxRate,
      total: totals.total,
      note,
      company: companyInfo,
    };

    const printed = printPosReceipt(receiptData, formatMoney);
    setLastCompletedReceipt(receiptData);
    setPosView('receipt');
    setShowRecentPanel(false);
    setShowHoldPanel(false);
    resetSale();

    toast.success('Sale completed', {
      module: 'POS',
      description: printed
        ? `${receiptId} · ${formatMoney(totals.total)}`
        : `${receiptId} · Sale saved — allow popups to print receipt`,
    });
    if (!printed) {
      toast.info('Receipt ready on screen', {
        module: 'POS',
        description: 'Use Print Again if the print window was blocked.',
      });
    }
  }, [
    cart,
    companyInfo,
    customerId,
    customerName,
    formatMoney,
    note,
    resetSale,
    t,
    taxRate,
    totals,
    apiStore,
  ]);

  const loadHeldSale = useCallback((hold: (typeof holds)[number]) => {
    setCart(hold.cart);
    setCustomerId(hold.customerId);
    setDiscount(hold.discount);
    setNote(hold.note);
    setTaxRate(hold.taxRate);
    setPosView('terminal');
    setShowHoldPanel(false);
    toast.success('Held sale loaded', { module: 'POS', description: hold.label });
  }, []);

  const holdSale = useCallback(() => {
    if (cart.length === 0) {
      if (holds.length > 0) {
        setShowHoldPanel(true);
        setShowRecentPanel(false);
        return;
      }
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
    setShowHoldPanel(true);
    toast.success('Sale held', { module: 'POS', description: nextHold.label });
  }, [cart, customerId, customerName, discount, holds, itemCount, note, resetSale, t, taxRate]);

  const showRecentSales = useCallback(() => {
    setShowHoldPanel(false);
    if (recentReceipts.length === 0) {
      toast.info('No recent POS sales yet', { module: 'POS', description: 'Complete a sale to see it here.' });
      setShowRecentPanel(false);
      return;
    }
    setShowRecentPanel((open) => !open);
  }, [recentReceipts.length]);

  const reprintReceiptData = useCallback((data: PosReceiptData) => {
    const ok = printPosReceipt({ ...data, company: data.company ?? companyInfo }, formatMoney);
    if (!ok) toast.error('Could not open print window', { module: 'POS' });
    return ok;
  }, [companyInfo, formatMoney]);

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
    setPosView('terminal');
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
    if (lastCompletedReceipt) {
      reprintReceiptData(lastCompletedReceipt);
      return;
    }

    if (cart.length > 0) {
      const ok = printPosReceipt(
        {
          receiptId: `PREVIEW-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          displayDate: new Date().toLocaleString(),
          customer: customerName,
          items: cart,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          taxRate,
          total: totals.total,
          note,
          company: companyInfo,
        },
        formatMoney,
      );
      if (!ok) toast.error('Could not open print window', { module: 'POS' });
      return;
    }

    if (recentReceipts.length === 0) {
      toast.info('No receipt to print', { module: 'POS', description: 'Complete a sale or add items first.' });
      return;
    }

    reprintReceiptData(recentReceipts[0]);
  }, [
    cart,
    companyInfo,
    customerName,
    formatMoney,
    lastCompletedReceipt,
    note,
    recentReceipts,
    reprintReceiptData,
    taxRate,
    totals,
  ]);

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
      if (event.key === 'F2' && posView === 'terminal') {
        event.preventDefault();
        completeSale();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [completeSale, posView]);

  const isPosBootLoading =
    productsStore.enabled && productsStore.loading && !productsStore.initialized;

  if (posView === 'receipt' && lastCompletedReceipt) {
    return (
      <>
        <PageHeader
          title={t('sales.pos_title')}
          subtitle="Receipt generated — print or start a new sale"
          icon={getPageIcon('/sales/pos')}
          size="compact"
          className="mb-2 shrink-0"
          actions={
            <button type="button" onClick={startNewSale} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> {t('sales.pos_new_sale')}
            </button>
          }
        />
        <PosReceiptView
          receipt={lastCompletedReceipt}
          formatMoney={formatMoney}
          onPrint={() => reprintReceiptData(lastCompletedReceipt)}
          onNewSale={startNewSale}
        />
        <Footer />
      </>
    );
  }

  if (isPosBootLoading) {
    return (
      <>
        <ApiModeBanner module="pos" error={apiStore.error || productsStore.error} />
        <PosPageSkeleton label={t('sales.pos_title')} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <ApiModeBanner module="pos" error={apiStore.error || productsStore.error} />
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
            <button type="button" onClick={startNewSale} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> {t('sales.pos_new_sale')}
            </button>
          </>
        }
      />

      {showHoldPanel ? (
        <div className="mb-3 premium-card premium-shadow p-3 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-extrabold text-slate-800">{t('sales.pos_held_sales')}</h3>
            <button
              type="button"
              onClick={() => setShowHoldPanel(false)}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 inline-flex items-center justify-center cursor-pointer"
              aria-label="Close held sales"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {holds.length === 0 ? (
            <p className="text-xs text-slate-500">No held sales. Add items and click Hold Sale.</p>
          ) : (
            <div className="space-y-1.5">
              {holds.map((hold) => (
                <div
                  key={hold.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{hold.label}</p>
                    <p className="text-[10px] text-slate-500">{new Date(hold.savedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void (async () => {
                        if (cart.length > 0) {
                          const ok = await confirmAction({
                            title: 'Restore held sale?',
                            message: 'Current cart will be replaced.',
                            confirmLabel: 'Restore',
                            module: 'POS',
                          });
                          if (!ok) return;
                        }
                        loadHeldSale(hold);
                      })()}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = holds.filter((h) => h.id !== hold.id);
                        setHolds(next);
                        savePosHolds(next);
                        toast.success('Held sale removed', { module: 'POS' });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showRecentPanel ? (
        <div className="mb-3 premium-card premium-shadow p-3 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-extrabold text-slate-800">{t('sales.pos_recent_sales')}</h3>
            <button
              type="button"
              onClick={() => setShowRecentPanel(false)}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-500 inline-flex items-center justify-center cursor-pointer"
              aria-label="Close recent sales"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {recentReceipts.map((receipt) => (
              <div
                key={receipt.receiptId}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {receipt.receiptId}
                    {receipt.invoiceId ? ` · ${receipt.invoiceId}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {receipt.displayDate || receipt.date} · {receipt.customer} · {formatMoney(receipt.total)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLastCompletedReceipt(receipt);
                    reprintReceiptData(receipt);
                  }}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] font-bold text-emerald-800 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Reprint
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-3 flex-1 min-h-0">
        <PosProductPanel
          products={filteredProducts}
          search={productsStore.enabled ? productsStore.search : search}
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
          onSearchChange={(v) => {
            if (productsStore.enabled) productsStore.setSearchTerm(v);
            else setSearch(v);
          }}
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
              onClick={() => void (async () => {
                if (cart.length > 0) {
                  const ok = await confirmAction({
                    title: 'Restore held sale?',
                    message: 'Current cart will be replaced.',
                    confirmLabel: 'Restore',
                    module: 'POS',
                  });
                  if (!ok) return;
                }
                loadHeldSale(hold);
              })()}
              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-800 cursor-pointer"
            >
              {hold.label}
            </button>
          ))}
          <button type="button" onClick={() => setShowHoldPanel(true)} className="text-[11px] font-bold text-blue-700 cursor-pointer">
            View all ({holds.length})
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
