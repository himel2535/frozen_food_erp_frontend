'use client';

import { Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatMoney, getRecipeBomCost, type Recipe } from '@/lib/services/recipes-service';

interface RecipeCardProps {
  recipe: Recipe;
  onCreateBom: () => void;
  onPlanProduction: () => void;
  onDelete: () => void;
}

export function RecipeCard({ recipe, onCreateBom, onPlanProduction, onDelete }: RecipeCardProps) {
  const materialCount = recipe.materials.length;
  const bomCost = getRecipeBomCost(recipe);
  const hasMaterials = materialCount > 0;

  return (
    <div className="premium-card premium-shadow p-3.5 flex flex-col gap-2 transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-extrabold text-slate-900 truncate">{recipe.product}</h3>
            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
              {recipe.model}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500">{recipe.recipeNumber}</p>
        </div>
        <StatusBadge status={recipe.status} />
      </div>

      <p className="text-[11px] font-semibold text-slate-600 leading-snug">
        BOM {recipe.version} • {materialCount} Material{materialCount === 1 ? '' : 's'} • Est. Cost {formatMoney(bomCost)} / product
      </p>

      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCreateBom}
          className="flex-1 min-w-0 px-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer truncate"
        >
          {hasMaterials ? 'Manage BOM' : 'Create BOM'}
        </button>
        <button
          type="button"
          onClick={onPlanProduction}
          disabled={!hasMaterials}
          title={hasMaterials ? 'Calculate materials for a batch' : 'Add BOM materials first'}
          className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-800 text-[10px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed truncate"
        >
          Plan Production
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 px-2.5 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
          aria-label="Delete recipe"
          title="Delete recipe"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
