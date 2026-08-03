'use client';

import { Calendar } from 'lucide-react';
import { ST_BODY, ST_CAPTION, ST_CARD_COMPACT, ST_TITLE } from '@/components/modules/settings/settings-styles';

type SignatureInvoicePreviewProps = {
  imageDataUrl?: string;
  signerName?: string;
  designation?: string;
  label?: string;
  labels: {
    title: string;
    authorized: string;
    sampleDate: string;
  };
};

export function SignatureInvoicePreview({
  imageDataUrl,
  signerName,
  designation,
  label,
  labels,
}: SignatureInvoicePreviewProps) {
  return (
    <div className={ST_CARD_COMPACT}>
      <h3 className={`${ST_TITLE} mb-1`}>{labels.title}</h3>
      <p className={`${ST_CAPTION} mb-4`}>{label || labels.authorized}</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 min-w-[140px]">
            <p className="text-[10px] font-extrabold text-slate-700 mb-2">{labels.authorized}</p>
            <div className="min-h-[56px] flex items-end justify-center pb-1">
              {imageDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={imageDataUrl} alt="" className="max-h-12 object-contain" />
              ) : (
                <span className="text-sm italic text-slate-300">Signature preview</span>
              )}
            </div>
            <p className={`${ST_BODY} text-xs mt-1`}>{signerName || '—'}</p>
            {designation ? <p className="text-[10px] text-slate-500">{designation}</p> : null}
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {labels.sampleDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Invoice Footer</p>
            <p className={`${ST_CAPTION} mt-1 max-w-[180px] ml-auto`}>
              Signature appears on printed invoices when enabled during invoice creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
