'use client';

export function ProfitLossFooterBar({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-slate-500 font-medium px-1">
      <span>
        Generated on: {generatedAt} | All amounts are in BDT (৳)
      </span>
    </div>
  );
}
