'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { step: 1, label: 'Follow-up Details' },
  { step: 2, label: 'Customer Response' },
  { step: 3, label: 'Next Action' },
  { step: 4, label: 'Review & Save' },
] as const;

export function FollowUpFormStepper({ activeStep = 1 }: { activeStep?: number }) {
  return (
    <nav aria-label="Follow-up form progress" className="overflow-x-auto pb-1">
      <ol className="flex items-center min-w-[560px] gap-0">
        {STEPS.map((item, index) => {
          const done = item.step < activeStep;
          const active = item.step === activeStep;
          const muted = item.step > activeStep;
          return (
            <li key={item.step} className="flex items-center flex-1 min-w-0">
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
                  {done ? <Check className="w-3.5 h-3.5" /> : item.step}
                </span>
                <span
                  className={`text-[11px] font-bold truncate ${
                    active ? 'text-blue-700' : muted ? 'text-slate-400' : 'text-emerald-700'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded-full min-w-[20px] ${
                    item.step < activeStep ? 'bg-emerald-400' : 'bg-slate-200'
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
