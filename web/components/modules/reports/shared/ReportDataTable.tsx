'use client';

import type { ReactNode } from 'react';
import { AppTable, type AppTableColumn, type AppTableProps } from '@/components/shared/AppTable';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { ReportTablePagination } from '@/components/modules/reports/shared/ReportTablePagination';
import { REPORT_TABLE_SECTION, REPORT_TABLE_SHELL } from '@/components/modules/reports/shared/report-table-styles';
import { useReportTablePagination } from '@/components/modules/reports/shared/useReportTablePagination';

export type ReportTableColumnContext = {
  pageOffset: number;
};

export type ReportDataTableProps<T extends object> = {
  title: string;
  icon?: ReactNode;
  onPrint?: () => void;
  printLabel?: string;
  action?: ReactNode;
  sectionClassName?: string;
  shellClassName?: string;
  columns: AppTableColumn<T>[] | ((ctx: ReportTableColumnContext) => AppTableColumn<T>[]);
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage: string;
  rowClassName?: AppTableProps<T>['rowClassName'];
  renderActions?: AppTableProps<T>['renderActions'];
  actionsLabel?: string;
  paginate?: number | false;
  paginationLabel?: (params: { from: number; to: number; total: number }) => string;
  footer?: ReactNode;
};

export function ReportDataTable<T extends object>({
  title,
  icon,
  onPrint,
  printLabel,
  action,
  sectionClassName = '',
  shellClassName = REPORT_TABLE_SHELL,
  columns,
  rows,
  rowKey,
  emptyMessage,
  rowClassName,
  renderActions,
  actionsLabel,
  paginate = false,
  paginationLabel,
  footer,
}: ReportDataTableProps<T>) {
  const pageSize = typeof paginate === 'number' ? paginate : 10;
  const pagination = useReportTablePagination(rows, pageSize);
  const displayRows = paginate ? pagination.pageRows : rows;
  const resolvedColumns = typeof columns === 'function'
    ? columns({ pageOffset: paginate ? pagination.pageOffset : 0 })
    : columns;

  const showPagination = Boolean(paginate && rows.length > 0 && paginationLabel);

  return (
    <section className={`${REPORT_TABLE_SECTION} ${sectionClassName}`.trim()}>
      <ReportSectionHeader
        icon={icon}
        title={title}
        onPrint={onPrint}
        printLabel={printLabel}
        action={action}
      />
      <div className={shellClassName}>
        <AppTable
          columns={resolvedColumns}
          rows={displayRows}
          rowKey={rowKey}
          emptyMessage={emptyMessage}
          rowClassName={rowClassName}
          renderActions={renderActions}
          actionsLabel={actionsLabel}
        />
        {showPagination ? (
          <ReportTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            label={paginationLabel!({ from: pagination.from, to: pagination.to, total: pagination.total })}
          />
        ) : null}
        {footer ? <div className="report-table-custom-footer">{footer}</div> : null}
      </div>
    </section>
  );
}
