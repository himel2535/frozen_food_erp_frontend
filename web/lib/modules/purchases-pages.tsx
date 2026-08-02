'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { RecipesPage as RecipesBomPage } from '@/components/modules/purchases/RecipesPage';

export function SuppliersPage() { return <DedicatedModule configId="purchases-suppliers" />; }
export { PurchaseOrdersPage } from '@/components/modules/purchases/PurchaseOrdersPage';
export { PurchaseRmPage } from '@/components/modules/purchases/PurchaseRmPage';
export function GoodsReceivedPage() { return <DedicatedModule configId="purchases-goods-received" />; }
export function BillsPage() { return <DedicatedModule configId="purchases-bills" />; }
export function PurchasePaymentsPage() { return <DedicatedModule configId="purchases-payments" />; }
export function PurchaseReturnsPage() { return <DedicatedModule configId="purchases-returns" />; }
export function RecipesPage() { return <RecipesBomPage />; }
