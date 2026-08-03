'use client';

import {
  ST_BODY,
  ST_CARD_COMPACT,
  ST_GRID,
  ST_LABEL,
} from '@/components/modules/settings/settings-styles';
import { SignatureInvoicePreview } from '@/components/modules/settings/signatures/SignatureInvoicePreview';
import { SignatureUploadZone } from '@/components/modules/settings/signatures/SignatureUploadZone';
import type { SignatureFormState } from '@/components/modules/settings/signatures/signature-form-utils';

const INPUT_CLS =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500';

type SignatureSettingsFormProps = {
  form: SignatureFormState;
  onChange: (key: keyof SignatureFormState, value: string | boolean) => void;
  labels: Record<string, string>;
};

export function SignatureSettingsForm({ form, onChange, labels }: SignatureSettingsFormProps) {
  return (
    <div className={ST_GRID}>
      <div className={`${ST_CARD_COMPACT} space-y-4`}>
        <SignatureUploadZone
          value={form.imageDataUrl}
          onChange={(value) => onChange('imageDataUrl', value)}
          labels={{
            title: labels.uploadTitle,
            hint: labels.uploadHint,
            replace: labels.uploadReplace,
            remove: labels.uploadRemove,
            invalid: labels.uploadInvalid,
            tooLarge: labels.uploadTooLarge,
          }}
        />

        <div>
          <label className={`${ST_LABEL} block mb-1.5`}>{labels.labelField}</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => onChange('label', e.target.value)}
            className={INPUT_CLS}
            placeholder={labels.labelPlaceholder}
          />
        </div>

        <div>
          <label className={`${ST_LABEL} block mb-1.5`}>
            {labels.signerName} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.signerName}
            onChange={(e) => onChange('signerName', e.target.value)}
            className={INPUT_CLS}
            placeholder={labels.signerNamePlaceholder}
          />
        </div>

        <div>
          <label className={`${ST_LABEL} block mb-1.5`}>{labels.designation}</label>
          <input
            type="text"
            value={form.designation}
            onChange={(e) => onChange('designation', e.target.value)}
            className={INPUT_CLS}
            placeholder={labels.designationPlaceholder}
          />
        </div>

        <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
          <div>
            <span className={`${ST_BODY} block text-sm`}>{labels.setDefault}</span>
            <span className="text-[11px] font-medium text-slate-500">{labels.setDefaultHint}</span>
          </div>
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => onChange('isDefault', e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
          />
        </label>
      </div>

      <SignatureInvoicePreview
        imageDataUrl={form.imageDataUrl}
        signerName={form.signerName}
        designation={form.designation}
        label={form.label}
        labels={{
          title: labels.previewTitle,
          authorized: labels.previewAuthorized,
          sampleDate: labels.previewDate,
        }}
      />
    </div>
  );
}
