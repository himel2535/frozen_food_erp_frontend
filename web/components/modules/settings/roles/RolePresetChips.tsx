'use client';

import { ROLE_PRESETS } from '@/lib/services/role-presets';
import type { SectionId } from '@/lib/state/types';

export function RolePresetChips({
  activeName,
  presetsLabel,
  onSelect,
}: {
  activeName: string;
  presetsLabel: string;
  onSelect: (preset: {
    name: string;
    description: string;
    allowedSections: SectionId[];
  }) => void;
}) {
  const normalizedActive = activeName.trim().toLowerCase();

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{presetsLabel}</p>
      <div className="flex flex-wrap gap-2">
        {ROLE_PRESETS.map((preset) => {
          const isActive = preset.name.toLowerCase() === normalizedActive;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => onSelect(preset)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'premium-card premium-shadow bg-white/45 text-slate-600 border-white/65 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
