'use client';

type ReportTablePaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
};

export function ReportTablePagination({
  page,
  totalPages,
  label,
  onPageChange,
}: ReportTablePaginationProps) {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5,
  );

  return (
    <div className="report-table-pagination flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 text-xs text-slate-500">
      <span className="font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50 hover:bg-slate-50"
        >
          Previous
        </button>
        {pageNumbers.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            className={`min-w-[32px] px-2 py-1.5 rounded-lg font-bold cursor-pointer ${
              n === page ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
