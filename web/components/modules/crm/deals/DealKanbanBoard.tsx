'use client';

import { Calendar, Plus } from 'lucide-react';
import type { DealRecord } from '@/lib/services/deals-pipeline-service';
import { stageHeaderClass, stageLabel } from '@/lib/services/deals-pipeline-service';
import { dealInitials, formatDealDate, priorityBadgeClass } from '@/components/modules/crm/deals/deal-display-utils';

export function DealKanbanBoard({
  stages,
  deals,
  formatMoney,
  onStageChange,
  onCardClick,
  onAddInStage,
}: {
  stages: string[];
  deals: DealRecord[];
  formatMoney: (n: number) => string;
  onStageChange: (dealId: string, fromStage: string, toStage: string) => void;
  onCardClick: (deal: DealRecord) => void;
  onAddInStage: (stage: string) => void;
}) {
  const handleDragStart = (e: React.DragEvent, deal: DealRecord) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ dealId: deal.id, fromStage: deal.stage }));
  };

  const handleDrop = (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { dealId: string; fromStage: string };
      if (data.fromStage !== toStage) onStageChange(data.dealId, data.fromStage, toStage);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 min-h-[460px]">
      {stages.map((stage) => {
        const cards = deals.filter((d) => d.stage === stage);
        const stageValue = cards.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0);
        return (
          <div
            key={stage}
            className="flex-shrink-0 w-[250px] rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className={`px-3 py-2.5 border-b ${stageHeaderClass(stage)}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold truncate">{stageLabel(stage)}</h3>
                <span className="text-[10px] font-bold tabular-nums shrink-0">{cards.length}</span>
              </div>
              <p className="text-[10px] font-semibold mt-0.5 tabular-nums">{formatMoney(stageValue)}</p>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[520px]">
              {cards.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal)}
                  onClick={() => onCardClick(deal)}
                  className="rounded-xl border border-white bg-white p-3 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800 leading-snug">{deal.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{deal.company}</p>
                  <p className="text-sm font-extrabold text-blue-600 mt-2 tabular-nums">{formatMoney(Number(deal.expectedValue ?? 0))}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${priorityBadgeClass(String(deal.priority ?? 'medium'))}`}>
                      {String(deal.priority ?? 'medium')}
                    </span>
                    <span className="inline-flex w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold items-center justify-center shrink-0">
                      {dealInitials(String(deal.assignedRepName ?? 'SR'))}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>{formatDealDate(String(deal.expectedCloseDate ?? ''))}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAddInStage(stage)}
              className="m-2 mt-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Deal
            </button>
          </div>
        );
      })}
    </div>
  );
}
