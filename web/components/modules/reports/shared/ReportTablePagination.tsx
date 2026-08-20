'use client';

import { Button } from '@/components/shared/Button';

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
        <Button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        {pageNumbers.map((n) => (
          <Button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            variant={n === page ? 'primary' : 'outline'}
            size="sm"
            className="min-w-[32px] px-2 py-1.5 font-bold"
          >
            {n}
          </Button>
        ))}
        <Button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
