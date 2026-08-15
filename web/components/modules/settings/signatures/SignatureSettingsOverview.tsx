'use client';

import { Icon } from '@iconify/react';
import { ArrowRight } from 'lucide-react';
import { SignatureCard } from '@/components/modules/settings/signatures/SignatureCard';
import { SignatureSettingsHeader } from '@/components/modules/settings/signatures/SignatureSettingsHeader';
import { ST_BODY, ST_CARD_COMPACT, ST_CAPTION, ST_GRID, ST_STACK } from '@/components/modules/settings/settings-styles';
import type { CompanySignature } from '@/lib/state/types';

type SignatureSettingsOverviewProps = {
  signatures: CompanySignature[];
  metrics: { total: number; hasDefault: boolean; defaultName: string };
  labels: Record<string, string>;
  accountName: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onGoInvoice: () => void;
  canGoInvoice: boolean;
};

export function SignatureSettingsOverview({
  signatures,
  metrics,
  labels,
  accountName,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  onGoInvoice,
  canGoInvoice,
}: SignatureSettingsOverviewProps) {
  return (
    <div className={ST_STACK}>
      <div className={`${ST_CARD_COMPACT} border border-violet-200/70 bg-violet-50/45`}>
        <p className={`${ST_BODY} text-sm font-semibold text-violet-900`}>
          {labels.personalNote}
        </p>
        <p className={`${ST_CAPTION} mt-1 text-violet-800/80`}>
          Signed as <span className="font-bold">{accountName}</span> — only you can use signatures saved here.
        </p>
      </div>

      <SignatureSettingsHeader
        subtitle={labels.subtitle}
        addLabel={labels.add}
        invoiceLabel={labels.goInvoice}
        invoiceDisabledHint={labels.goInvoiceDisabled}
        canGoInvoice={canGoInvoice}
        totalLabel={labels.kpiTotal}
        totalValue={metrics.total}
        defaultLabel={labels.kpiDefault}
        defaultValue={metrics.hasDefault ? metrics.defaultName : labels.noDefault}
        onAdd={onAdd}
        onGoInvoice={onGoInvoice}
      />

      {signatures.length === 0 ? (
        <div className={`${ST_CARD_COMPACT} text-center py-10`}>
          <div className="flex justify-center mb-4">
            <Icon icon="fluent-color:signature-24" width={72} height={72} className="opacity-80" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">{labels.emptyTitle}</h3>
          <p className="text-xs text-slate-500 font-medium mt-1 max-w-md mx-auto">{labels.emptyHint}</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
          >
            {labels.add}
          </button>
        </div>
      ) : (
        <>
          <div className={ST_GRID}>
            {signatures.map((signature) => (
              <SignatureCard
                key={signature.id}
                signature={signature}
                labels={{
                  default: labels.default,
                  edit: labels.edit,
                  delete: labels.delete,
                  setDefault: labels.setDefault,
                }}
                onEdit={() => onEdit(signature.id)}
                onDelete={() => onDelete(signature.id)}
                onSetDefault={() => onSetDefault(signature.id)}
              />
            ))}
          </div>

          <div className={`${ST_CARD_COMPACT} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
            <div>
              <h3 className={`${ST_BODY} text-sm font-extrabold text-slate-900`}>{labels.goInvoiceHint}</h3>
              <p className={`${ST_CAPTION} mt-0.5`}>{labels.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onGoInvoice}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 self-start sm:self-auto"
            >
              {labels.goInvoice}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
