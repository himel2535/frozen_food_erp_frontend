'use client';

import { Check } from 'lucide-react';
import { PROJECT_SETUP_STEPS } from '@/components/modules/projects/project-form/project-form-types';

export function ProjectSetupProgress({ activeStep }: { activeStep: number }) {
  return (
    <section className="premium-card premium-shadow p-3.5 space-y-3">
      <h4 className="text-sm font-extrabold text-slate-900">Setup Progress</h4>
      <ol className="space-y-2">
        {PROJECT_SETUP_STEPS.map((step) => {
          const done = step.step < activeStep;
          const active = step.step === activeStep;
          return (
            <li key={step.key} className="flex items-center gap-2.5">
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-[10px] font-extrabold border-2 ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : step.step}
              </span>
              <span
                className={`text-xs font-bold ${
                  active ? 'text-blue-700' : done ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ProjectHelpTip() {
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
      <p className="text-[11px] font-bold text-blue-900 mb-1">Helpful Tip</p>
      <p className="text-[11px] font-medium text-blue-800/90 leading-relaxed">
        Complete project details and line items first. After creation you&apos;ll proceed to BOM / Recipe setup
        to define materials and production steps.
      </p>
    </section>
  );
}
