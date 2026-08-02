'use client';

import { LEAD_PIPELINE_STAGES, LEAD_STAGE_LABELS } from '@/lib/services/crm-service';
import { PIPELINE_STAGE_COLORS } from './lead-display-utils';

export function LeadPipelineFunnel({
  counts,
  activeStage,
  onStageClick,
}: {
  counts: Record<string, number>;
  activeStage: string | null;
  onStageClick: (stage: string | null) => void;
}) {
  const total = LEAD_PIPELINE_STAGES.reduce((sum, stage) => sum + (counts[stage] || 0), 0) || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        {LEAD_PIPELINE_STAGES.map((stage) => {
          const count = counts[stage] || 0;
          const width = Math.max((count / total) * 100, count > 0 ? 4 : 0);
          return (
            <button
              key={stage}
              type="button"
              title={`${LEAD_STAGE_LABELS[stage]} (${count})`}
              onClick={() => onStageClick(activeStage === stage ? null : stage)}
              style={{ width: `${width}%` }}
              className={`${PIPELINE_STAGE_COLORS[stage] || 'bg-slate-300'} min-w-0 transition-opacity cursor-pointer ${
                activeStage && activeStage !== stage ? 'opacity-40' : 'opacity-100'
              }`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEAD_PIPELINE_STAGES.map((stage) => {
          const count = counts[stage] || 0;
          const isActive = activeStage === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => onStageClick(isActive ? null : stage)}
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer rounded-lg px-2 py-1 ${
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${PIPELINE_STAGE_COLORS[stage] || 'bg-slate-300'}`} />
              {LEAD_STAGE_LABELS[stage]} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
