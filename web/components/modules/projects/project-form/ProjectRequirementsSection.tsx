'use client';

import { ClipboardList } from 'lucide-react';
import { IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import type { ProjectFormValues } from '@/components/modules/projects/project-form/project-form-types';

export function ProjectRequirementsSection({
  form,
  onChange,
}: {
  form: ProjectFormValues;
  onChange: (patch: Partial<ProjectFormValues>) => void;
}) {
  return (
    <div className="space-y-3">
      <IconTextarea
        label="Special Instructions & Project Notes"
        icon={ClipboardList}
        rows={4}
        value={form.specialInstructions || ''}
        onChange={(e) => onChange({ specialInstructions: e.target.value })}
        placeholder="Enter any custom requirements, assembly rules, worker guidelines, packaging notes, or special instructions here..."
      />
    </div>
  );
}
