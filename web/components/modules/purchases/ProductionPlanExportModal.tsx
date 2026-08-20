'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Download, X } from 'lucide-react';
import {
  DEFAULT_PRODUCTION_PLAN_PDF_OPTIONS,
  type ProductionPlanPdfOptions,
} from '@/lib/services/export-production-plan-pdf';

interface ProductionPlanExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ProductionPlanPdfOptions) => void;
  exporting?: boolean;
}

const CHECKBOX_CLS =
  'h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer';

export function ProductionPlanExportModal({
  open,
  onClose,
  onExport,
  exporting = false,
}: ProductionPlanExportModalProps) {
  const [options, setOptions] = useState<ProductionPlanPdfOptions>(DEFAULT_PRODUCTION_PLAN_PDF_OPTIONS);

  useEffect(() => {
    if (open) setOptions(DEFAULT_PRODUCTION_PLAN_PDF_OPTIONS);
  }, [open]);

  if (!open) return null;

  const toggle = (key: keyof ProductionPlanPdfOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="production-plan-export-title"
        className="relative w-full max-w-[420px] premium-card premium-shadow p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="production-plan-export-title" className="text-base font-extrabold text-slate-900">
              Export Production Plan PDF
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Choose sensitive columns to include. Uncheck cost or shortfall fields when sharing externally.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className={CHECKBOX_CLS}
              checked={options.showUnitCost}
              onChange={() => toggle('showUnitCost')}
            />
            <span className="text-xs font-bold text-slate-700">Unit Cost (tk)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className={CHECKBOX_CLS}
              checked={options.showTotalCost}
              onChange={() => toggle('showTotalCost')}
            />
            <span className="text-xs font-bold text-slate-700">Total Cost (tk)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className={CHECKBOX_CLS}
              checked={options.showShortfall}
              onChange={() => toggle('showShortfall')}
            />
            <span className="text-xs font-bold text-slate-700">Shortfall</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            onClick={onClose}
            disabled={exporting}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onExport(options)}
            disabled={exporting}
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {exporting ? 'Exporting…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
