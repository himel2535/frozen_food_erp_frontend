'use client';

import { Pencil, Star, Trash2 } from 'lucide-react';
import {
  ST_BODY,
  ST_CAPTION,
  ST_CARD_COMPACT,
  ST_LABEL,
  ST_TITLE,
} from '@/components/modules/settings/settings-styles';
import type { CompanySignature } from '@/lib/state/types';

type SignatureCardProps = {
  signature: CompanySignature;
  labels: {
    default: string;
    edit: string;
    delete: string;
    setDefault: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
};

export function SignatureCard({ signature, labels, onEdit, onDelete, onSetDefault }: SignatureCardProps) {
  return (
    <div className={`${ST_CARD_COMPACT} flex flex-col h-full`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className={ST_TITLE}>{signature.label}</h3>
          <p className={`${ST_CAPTION} mt-0.5 truncate`}>{signature.signerName}</p>
        </div>
        {signature.isDefault ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold shrink-0">
            <Star className="w-3 h-3 fill-current" />
            {labels.default}
          </span>
        ) : null}
      </div>

      <div
        className="rounded-xl border border-slate-100 min-h-[120px] flex items-center justify-center p-4 mb-3"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #f8fafc 25%, transparent 25%), linear-gradient(-45deg, #f8fafc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8fafc 75%), linear-gradient(-45deg, transparent 75%, #f8fafc 75%)',
          backgroundSize: '14px 14px',
          backgroundPosition: '0 0, 0 7px, 7px -7px, -7px 0',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signature.imageDataUrl} alt="" className="max-h-20 max-w-full object-contain" />
      </div>

      {signature.designation ? (
        <p className={`${ST_LABEL} mb-3`}>{signature.designation}</p>
      ) : (
        <p className={`${ST_LABEL} mb-3 text-slate-300`}>—</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-100 text-blue-700 text-xs font-bold cursor-pointer transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          {labels.edit}
        </button>
        {!signature.isDefault ? (
          <button
            type="button"
            onClick={onSetDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            <Star className="w-3.5 h-3.5" />
            {labels.setDefault}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer transition-colors ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {labels.delete}
        </button>
      </div>
    </div>
  );
}
