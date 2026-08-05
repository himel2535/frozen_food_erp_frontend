'use client';

import { useMemo } from 'react';
import { UserCog } from 'lucide-react';
import {
  CF_ICON_CLS,
  CF_INPUT_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import { ROLE_PRESETS, findRolePreset } from '@/lib/services/role-presets';
import type { RoleRecord } from '@/lib/state/types';

export function RoleNameInput({
  value,
  existingRoles,
  hint,
  onChange,
  onPresetSelect,
}: {
  value: string;
  existingRoles: RoleRecord[];
  hint: string;
  onChange: (name: string) => void;
  onPresetSelect: (preset: { name: string; description: string; allowedSections: RoleRecord['allowedSections'] }) => void;
}) {
  const suggestions = useMemo(() => {
    const presetNames = ROLE_PRESETS.map((p) => p.name);
    const existingNames = existingRoles.map((r) => r.name).filter(Boolean);
    const merged = [...new Set([...presetNames, ...existingNames])];
    return merged.sort((a, b) => a.localeCompare(b));
  }, [existingRoles]);

  const handleBlur = () => {
    const preset = findRolePreset(value);
    if (preset) {
      onPresetSelect(preset);
    }
  };

  const handleInput = (next: string) => {
    onChange(next);
    const preset = findRolePreset(next);
    if (preset && preset.name.toLowerCase() === next.trim().toLowerCase()) {
      onPresetSelect(preset);
    }
  };

  return (
    <div>
      <div className="relative flex items-center">
        <UserCog className={CF_ICON_CLS} />
        <input
          type="text"
          list="role-name-suggestions"
          required
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={handleBlur}
          placeholder="e.g. Sales Manager"
          className={CF_INPUT_CLS}
        />
      </div>
      <datalist id="role-name-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>
    </div>
  );
}
