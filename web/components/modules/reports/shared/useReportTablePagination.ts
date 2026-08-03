import { useMemo, useState } from 'react';

export function useReportTablePagination<T>(rows: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageOffset = (safePage - 1) * pageSize;
  const pageRows = useMemo(() => rows.slice(pageOffset, pageOffset + pageSize), [rows, pageOffset, pageSize]);

  const from = total ? pageOffset + 1 : 0;
  const to = Math.min(safePage * pageSize, total);

  return {
    page: safePage,
    setPage,
    pageRows,
    pageOffset,
    from,
    to,
    totalPages,
    total,
  };
}
