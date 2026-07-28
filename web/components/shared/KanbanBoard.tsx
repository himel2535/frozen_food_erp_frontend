'use client';

export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  stage: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onStageChange: (cardId: string, fromStage: string, toStage: string) => void;
  onCardClick?: (card: KanbanCard) => void;
}

export function KanbanBoard({ columns, onStageChange, onCardClick }: KanbanBoardProps) {
  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, fromStage: card.stage }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { cardId: string; fromStage: string };
      if (data.fromStage !== toStage) {
        onStageChange(data.cardId, data.fromStage, toStage);
      }
    } catch {
      /* ignore malformed drag data */
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[420px]">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-shrink-0 w-64 bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
        >
          <div className="px-3 py-2.5 border-b border-slate-200 bg-white/60 rounded-t-xl">
            <h3 className="text-xs font-bold text-slate-700">{col.title}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">{col.cards.length} deals</span>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[520px]">
            {col.cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, card)}
                onClick={() => onCardClick?.(card)}
                className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 truncate">{card.title}</p>
                {card.subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{card.subtitle}</p>}
                {card.meta && <p className="text-[10px] text-blue-600 font-semibold mt-1">{card.meta}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {columns
                    .filter((c) => c.id !== card.stage)
                    .slice(0, 3)
                    .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStageChange(card.id, card.stage, c.id);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        → {c.title.split(' ')[0]}
                      </button>
                    ))}
                </div>
              </div>
            ))}
            {col.cards.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-6">Drop deals here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
