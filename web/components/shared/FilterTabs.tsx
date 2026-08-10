'use client';

export interface FilterTab {
  id: string;
  label: string;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  active: string;
  onChange: (id: string) => void;
  wrap?: boolean;
}

export function FilterTabs({ tabs, active, onChange, wrap = false }: FilterTabsProps) {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${wrap ? 'flex-wrap' : 'flex-nowrap'}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            active === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
