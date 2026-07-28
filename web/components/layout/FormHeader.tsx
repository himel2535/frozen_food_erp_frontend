'use client';

import { ArrowLeft } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  titleId?: string;
}

export function FormHeader({ title, subtitle, onBack, titleId }: FormHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        type="button"
        onClick={onBack}
        className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 bg-white border border-slate-200 premium-shadow cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h3 id={titleId} className="text-xl font-bold text-slate-900">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
