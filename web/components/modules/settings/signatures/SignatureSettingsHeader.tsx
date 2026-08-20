'use client';

import { ArrowRight, PenLine, Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Icon } from '@iconify/react';
import {
  ST_ACCENT_BAR,
  ST_CAPTION,
  ST_CARD,
} from '@/components/modules/settings/settings-styles';

type SignatureSettingsHeaderProps = {
  subtitle: string;
  addLabel: string;
  invoiceLabel: string;
  invoiceDisabledHint: string;
  canGoInvoice: boolean;
  totalLabel: string;
  totalValue: number;
  defaultLabel: string;
  defaultValue: string;
  onAdd: () => void;
  onGoInvoice: () => void;
};

export function SignatureSettingsHeader({
  subtitle,
  addLabel,
  invoiceLabel,
  invoiceDisabledHint,
  canGoInvoice,
  totalLabel,
  totalValue,
  defaultLabel,
  defaultValue,
  onAdd,
  onGoInvoice,
}: SignatureSettingsHeaderProps) {
  return (
    <div className={`relative overflow-hidden ${ST_CARD} bg-gradient-to-br from-violet-50/40 via-white to-indigo-50/30`}>
      <div className={ST_ACCENT_BAR} />
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 pt-1">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 ring-4 ring-white shadow-md bg-violet-100 text-violet-700">
            <PenLine className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Signatures</h1>
            <p className={`${ST_CAPTION} mt-1 max-w-2xl`}>{subtitle}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
                {totalLabel}: {totalValue}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                {defaultLabel}: {defaultValue}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              onClick={onGoInvoice}
              disabled={!canGoInvoice}
              title={canGoInvoice ? invoiceLabel : invoiceDisabledHint}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {invoiceLabel}
            </Button>
            <Button
              type="button"
              onClick={onAdd}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {addLabel}
            </Button>
          </div>
          {!canGoInvoice ? (
            <p className={`${ST_CAPTION} text-right max-w-[220px]`}>{invoiceDisabledHint}</p>
          ) : null}
          <div className="hidden lg:flex items-end justify-center w-40 xl:w-48">
            <Icon icon="fluent-color:signature-24" width={140} height={140} className="opacity-90" />
          </div>
        </div>
      </div>
    </div>
  );
}
