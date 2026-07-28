'use client';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions?: React.ReactNode;
}

export function BulkActionBar({ count, onClear, actions }: BulkActionBarProps) {
  if (count <= 0) return null;
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs">
      <span className="font-bold text-blue-800">{count} selected</span>
      <div className="flex items-center gap-2">
        {actions}
        <button type="button" onClick={onClear} className="text-blue-600 font-bold hover:underline cursor-pointer">
          Clear
        </button>
      </div>
    </div>
  );
}
