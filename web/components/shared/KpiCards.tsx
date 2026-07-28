'use client';

export interface KpiCardItem {
  key: string;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  icon?: React.ReactNode;
}

export function KpiCards({ items }: { items: KpiCardItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.key} className="premium-card premium-shadow p-4 rounded-2xl">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
            {item.icon}
          </div>
          <div className="mt-2">
            <div className="text-lg font-extrabold text-slate-900">{item.value}</div>
            {item.alert ? (
              <div className="text-[11px] text-red-600 font-bold mt-0.5">Requires attention</div>
            ) : item.sub ? (
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{item.sub}</div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
