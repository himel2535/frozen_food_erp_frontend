'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { RecipesPage as RecipesBomPage } from '@/components/modules/purchases/RecipesPage';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';

function cfg(id: string) {
  return getLegacyParityConfig(id);
}

export function SuppliersPage() { return <DedicatedModule config={cfg('purchases-suppliers')} />; }
export function PurchaseOrdersPage() { return <DedicatedModule config={cfg('purchases-orders')} />; }
export function GoodsReceivedPage() { return <DedicatedModule config={cfg('purchases-goods-received')} />; }
export function BillsPage() { return <DedicatedModule config={cfg('purchases-bills')} />; }
export function PurchasePaymentsPage() { return <DedicatedModule config={cfg('purchases-payments')} />; }
export function PurchaseReturnsPage() { return <DedicatedModule config={cfg('purchases-returns')} />; }
export function RecipesPage() { return <RecipesBomPage />; }
