'use client';

import { X } from 'lucide-react';

interface ProfileDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  children: React.ReactNode;
}

export function ProfileDrawer({
  open,
  title,
  subtitle,
  onClose,
  tabs,
  activeTab,
  onTabChange,
  children,
}: ProfileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/30 cursor-pointer" aria-label="Close drawer" onClick={onClose} />
      <aside className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {tabs && tabs.length > 0 && onTabChange && (
          <div className="flex gap-1 px-5 pt-3 border-b border-slate-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-2 text-xs font-bold border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
