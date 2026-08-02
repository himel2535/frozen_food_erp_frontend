'use client';

import { ClipboardList, Layers, Package, Palette, Upload } from 'lucide-react';
import { IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import {
  PJ_TEXTAREA_GRID_CLS,
  PJ_UPLOAD_CLS,
} from '@/components/modules/projects/project-form/project-form-styles';
import {
  PROJECT_SAMPLE_OPTIONS,
  type ProjectFormValues,
} from '@/components/modules/projects/project-form/project-form-types';

export function ProjectRequirementsSection({
  form,
  onChange,
}: {
  form: ProjectFormValues;
  onChange: (patch: Partial<ProjectFormValues>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className={PJ_TEXTAREA_GRID_CLS}>
        <IconTextarea
          label="Product Specification"
          icon={ClipboardList}
          rows={3}
          value={form.productSpecification}
          onChange={(e) => onChange({ productSpecification: e.target.value })}
          placeholder="Dimensions, features, safety standards..."
        />
        <IconTextarea
          label="Material Quality"
          icon={Layers}
          rows={3}
          value={form.materialQuality}
          onChange={(e) => onChange({ materialQuality: e.target.value })}
          placeholder="Material grade, certifications..."
        />
        <IconTextarea
          label="Packaging & Printing"
          icon={Package}
          rows={3}
          value={form.packagingPrinting}
          onChange={(e) => onChange({ packagingPrinting: e.target.value })}
          placeholder="Box type, label design, barcode..."
        />
        <IconTextarea
          label="Branding"
          icon={Palette}
          rows={3}
          value={form.branding}
          onChange={(e) => onChange({ branding: e.target.value })}
          placeholder="Logo placement, colors, brand guidelines..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <IconSelect
          label="Sample Required"
          icon={Package}
          value={form.sampleRequired}
          onChange={(e) => onChange({ sampleRequired: e.target.value })}
        >
          {PROJECT_SAMPLE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </IconSelect>
        <IconTextarea
          label="Special Instructions"
          icon={ClipboardList}
          rows={2}
          value={form.specialInstructions}
          onChange={(e) => onChange({ specialInstructions: e.target.value })}
          placeholder="Any additional notes for production..."
        />
      </div>

      <div>
        <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Attachments
        </label>
        <button
          type="button"
          onClick={() => window.alert('File upload — coming soon.')}
          className={`${PJ_UPLOAD_CLS} w-full cursor-pointer`}
        >
          <Upload className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
          <p className="text-[11px] font-semibold text-blue-800">
            Drop files or click to upload
          </p>
          <p className="text-[10px] text-blue-600/80 mt-0.5">PDF, JPG, PNG up to 10MB</p>
        </button>
      </div>
    </div>
  );
}
