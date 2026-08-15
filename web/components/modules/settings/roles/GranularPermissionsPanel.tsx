'use client';

import { Check } from 'lucide-react';
import {
  GRANULAR_PERMISSION_LABELS,
  INVENTORY_EDIT_PERMISSION,
  type GranularPermission,
} from '@/lib/config/granular-permissions';
import type { SectionId } from '@/lib/state/types';

const INVENTORY_SECTION: SectionId = 'inventory';

export function GranularPermissionsPanel({
  allowedSections,
  allowedPermissions,
  onTogglePermission,
  disabled = false,
}: {
  allowedSections: SectionId[];
  allowedPermissions: string[];
  onTogglePermission: (permission: GranularPermission) => void;
  disabled?: boolean;
}) {
  const inventoryAccess = allowedSections.includes(INVENTORY_SECTION);
  if (!inventoryAccess) return null;

  const checked = allowedPermissions.includes(INVENTORY_EDIT_PERMISSION);

  return (
    <div className={`rounded-xl border border-violet-200/70 bg-violet-50/45 p-3.5 space-y-2 ${disabled ? 'opacity-60' : ''}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-800">Inventory permissions</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onTogglePermission(INVENTORY_EDIT_PERMISSION);
        }}
        className={`w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border transition-all ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${
          checked
            ? 'border-violet-300 bg-white/80 shadow-sm'
            : 'border-white/70 bg-white/50 hover:bg-white/70 hover:border-violet-200'
        }`}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
            checked ? 'bg-violet-600 text-white' : 'border-2 border-slate-200'
          }`}
        >
          {checked ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
        </span>
        <span className="flex-1 text-xs font-semibold text-slate-700">
          {GRANULAR_PERMISSION_LABELS[INVENTORY_EDIT_PERMISSION]}
        </span>
      </button>
      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
        Without this, users can view and add inventory records but cannot edit, delete, update, transfer, approve, or adjust existing stock.
      </p>
    </div>
  );
}
