'use client';

import { Check } from 'lucide-react';
import { PROJECT_SETUP_STEPS } from '@/components/modules/projects/project-form/project-form-types';

export function ProjectFormStepper({ activeStep }: { activeStep: number }) {
  return (
    <nav aria-label="Project setup progress" className="mb-3 overflow-x-auto">
      <ol className="flex items-center min-w-[640px] gap-0">
        {PROJECT_SETUP_STEPS.map((step, index) => {
          const done = step.step < activeStep;
          const active = step.step === activeStep;
          const muted = step.step > activeStep;
          return (
            <li key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-xs font-extrabold border-2 transition-colors ${
                    done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : active
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : step.step}
                </span>
                <span
                  className={`text-[11px] font-bold truncate ${
                    active ? 'text-blue-700' : muted ? 'text-slate-400' : 'text-emerald-700'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < PROJECT_SETUP_STEPS.length - 1 ? (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full min-w-[24px] ${
                    step.step < activeStep ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
