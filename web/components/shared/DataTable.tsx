'use client';

interface DataTableProps {
  columns: { key: string; label: string }[];
  rows: Array<Record<string, unknown>>;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  renderCell?: (key: string, row: Record<string, unknown>) => React.ReactNode;
}

export function DataTable({ columns, rows, onEdit, onDelete, renderCell }: DataTableProps) {
  const colSpan = columns.length + (onEdit || onDelete ? 1 : 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 premium-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px]">
              {columns.map((col) => (
                <th key={col.key} className="p-4 pl-6">{col.label}</th>
              ))}
              {(onEdit || onDelete) && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {rows.length === 0 ? (
              <tr><td colSpan={colSpan} className="p-8 text-center text-slate-400">No records found</td></tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={String(row.id ?? idx)} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="p-4 pl-6">
                      {renderCell ? renderCell(col.key, row) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="p-4 text-right space-x-2">
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(row)} className="text-blue-600 hover:text-blue-800 text-[10px] font-bold cursor-pointer">Edit</button>
                      )}
                      {onDelete && (
                        <button type="button" onClick={() => onDelete(row)} className="text-rose-600 hover:text-rose-800 text-[10px] font-bold cursor-pointer">Delete</button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
