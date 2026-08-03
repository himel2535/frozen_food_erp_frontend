'use client';

import { ArrowLeft } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  titleId?: string;
  compact?: boolean;
}

export function FormHeader({ title, subtitle, onBack, backLabel, titleId, compact = false }: FormHeaderProps) {
  return (
    <div className={`flex items-center gap-4 ${compact ? 'mb-3' : 'mb-6'}`}>
      <button
        type="button"
        onClick={onBack}
        className="p-2.5 bg-white/60 hover:bg-white/90 border border-white/80 rounded-2xl shadow-xs transition-all text-slate-700 hover:text-slate-900 cursor-pointer"
        title={backLabel ?? 'Back'}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        {backLabel ? (
          <p className="text-[11px] font-bold text-slate-500 mb-1">{backLabel}</p>
        ) : null}
        <h3 id={titleId} className="text-xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h3>
        {subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
