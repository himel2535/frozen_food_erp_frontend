'use client';

import { PaginationBar } from '@/components/modules/inventory/shared/inventory-ui';

type ListPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className = 'mt-2 px-1',
}: ListPaginationProps) {
  if (total <= pageSize) return null;
  return (
    <div className={className}>
      <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}
