'use client';

import { RecipesPage } from '@/components/modules/purchases/RecipesPage';

export function FinishedGoodsBomPage() {
  return <RecipesPage variant="finished-goods" />;
}

export function SemiFinishedBomPage() {
  return <RecipesPage variant="semi-finished" />;
}
