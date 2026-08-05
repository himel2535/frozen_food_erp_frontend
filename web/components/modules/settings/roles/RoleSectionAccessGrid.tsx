'use client';

import { Icon } from '@iconify/react';
import { Check } from 'lucide-react';
import { TENANT_SIDEBAR_SECTIONS } from '@/lib/navigation/tenant-sidebar';
import type { SectionId } from '@/lib/state/types';

const sectionMeta = Object.fromEntries(
  TENANT_SIDEBAR_SECTIONS.map((s) => [s.id, { label: s.label, icon: s.iconifyIcon ?? 'fluent-color:apps-24' }]),
);

export function RoleSectionAccessGrid({
  selected,
  onToggle,
  disabled = false,
}: {
  selected: SectionId[];
  onToggle: (id: SectionId) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${disabled ? 'opacity-60' : ''}`}>
      {TENANT_SIDEBAR_SECTIONS.map((section) => {
        const id = section.id as SectionId;
        const checked = selected.includes(id);
        const meta = sectionMeta[id] ?? { label: section.label, icon: 'fluent-color:apps-24' };
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onToggle(id);
            }}
            className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border transition-all ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            } ${
              checked
                ? 'premium-card premium-shadow border-blue-300/80 bg-blue-50/55 shadow-sm shadow-blue-500/10'
                : `premium-card premium-shadow border-white/65 bg-white/40 ${
                    disabled ? '' : 'hover:bg-white/55 hover:border-blue-200/70'
                  }`
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                checked ? 'bg-white/80' : 'bg-white/50'
              }`}
            >
              <Icon icon={meta.icon} width={22} height={22} />
            </span>
            <span className={`flex-1 text-xs font-semibold ${checked ? 'text-blue-900' : 'text-slate-700'}`}>
              {meta.label}
            </span>
            {checked ? (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shrink-0">
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
