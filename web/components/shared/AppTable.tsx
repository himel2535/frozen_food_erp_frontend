'use client';

import type { ReactNode } from 'react';

export type AppTableColumn<T = Record<string, unknown>> = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  render?: (row: T, index: number) => ReactNode;
};

export type AppTableProps<T = Record<string, unknown>> = {
  columns: AppTableColumn<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  renderActions?: (row: T, index: number) => ReactNode;
  actionsLabel?: string;
  getCellValue?: (row: T, column: AppTableColumn<T>) => ReactNode;
  footer?: ReactNode;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
};

const CENTER_ALIGN_KEYS = new Set([
  'status',
  'id',
  'date',
  'method',
  'phone',
  'checkin',
  'checkout',
  'progress',
  'health',
  'deadline',
  'utilization',
  'utilizationpercent',
  'stockpolicy',
  'policy',
  'conversion',
  'conversionfactor',
  'productsusing',
  'products',
  'created',
  'createdat',
  'createddate',
  'ending',
  'endingdate',
  'enddate',
]);

const CENTER_ALIGN_LABELS = new Set([
  'status',
  'actions',
  'date',
  'method',
  'id',
  'phone',
  'utilization',
  'policy',
  'products',
  'conversion',
  'products using',
  'check in',
  'check out',
  'progress',
  'progress %',
  'health',
  'deadline',
  'created',
  'created date',
  'ending date',
  'ending',
]);

function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}

function normalizeKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function resolveColumnAlign(
  key: string,
  label: string,
  explicitAlign?: AppTableColumn['align'],
): AppTableColumn['align'] {
  if (explicitAlign) return explicitAlign;

  const normalizedKey = normalizeKey(key);
  const normalizedLabel = normalizeLabel(label);

  if (CENTER_ALIGN_KEYS.has(normalizedKey)) return 'center';
  if (CENTER_ALIGN_LABELS.has(normalizedLabel)) return 'center';
  if (normalizedLabel.endsWith('#')) return 'center';

  return 'left';
}

function alignClass(align: AppTableColumn['align'] = 'left') {
  if (align === 'center') return 'app-table-align-center';
  if (align === 'right') return 'app-table-align-right';
  return 'app-table-align-left';
}

function cellInnerClass(align: AppTableColumn['align'] = 'left') {
  return `app-table-cell-inner app-table-cell-inner--${align ?? 'left'}`;
}

export function AppTable<T extends object = Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No records found.',
  loading = false,
  className = '',
  renderActions,
  actionsLabel = 'Actions',
  getCellValue,
  footer,
  onRowClick,
  rowClassName,
}: AppTableProps<T>) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  return (
    <div className={`app-table ${className}`.trim()}>
      <div className="app-table-scroll">
        <table className="app-table-element">
          <thead className="app-table-head">
            <tr>
              {columns.map((col) => {
                const align = resolveColumnAlign(col.key, col.label, col.align);
                return (
                  <th
                    key={col.key}
                    data-align={align}
                    className={`app-table-th ${col.headerClassName ?? ''} ${alignClass(align)}`.trim()}
                  >
                    {col.label}
                  </th>
                );
              })}
              {renderActions && (
                <th
                  data-align="center"
                  className="app-table-th app-table-th-actions app-table-align-center"
                >
                  {actionsLabel}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={`loading-${i}`} className="app-table-tr">
                  {columns.map((col) => {
                    const align = resolveColumnAlign(col.key, col.label, col.align);
                    return (
                      <td key={col.key} data-align={align} className={`app-table-td ${alignClass(align)}`}>
                        <div className={cellInnerClass(align)}>
                          <div className="app-table-skeleton" />
                        </div>
                      </td>
                    );
                  })}
                  {renderActions && (
                    <td data-align="center" className="app-table-td app-table-td-actions app-table-align-center">
                      <div className={cellInnerClass('center')}>
                        <div className="app-table-skeleton w-16" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr className="app-table-tr">
                <td colSpan={colSpan} className="app-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const extraRowClass = typeof rowClassName === 'function'
                  ? rowClassName(row, index)
                  : (rowClassName ?? '');
                const rowId = rowKey ? rowKey(row, index) : String((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).ref ?? (row as Record<string, unknown>).sku ?? (row as Record<string, unknown>).name ?? index);
                return (
                <tr
                  key={rowId}
                  data-row-id={rowId}
                  className={`app-table-tr ${onRowClick ? 'cursor-pointer' : ''} ${extraRowClass}`.trim()}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                >
                  {columns.map((col) => {
                    const align = resolveColumnAlign(col.key, col.label, col.align);
                    const content = col.render
                      ? col.render(row, index)
                      : getCellValue
                        ? getCellValue(row, col)
                        : String((row as Record<string, unknown>)[col.key] ?? '—');

                    return (
                      <td
                        key={col.key}
                        data-align={align}
                        className={`app-table-td ${col.className ?? ''} ${alignClass(align)}`.trim()}
                      >
                        <div className={cellInnerClass(align)}>{content}</div>
                      </td>
                    );
                  })}
                  {renderActions && (
                    <td
                      data-align="center"
                      className="app-table-td app-table-td-actions app-table-align-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={cellInnerClass('center')}>
                        <div className="app-table-actions">{renderActions(row, index)}</div>
                      </div>
                    </td>
                  )}
                </tr>
              );
              })
            )}
          </tbody>
          {footer ? <tfoot>{footer}</tfoot> : null}
        </table>
      </div>
    </div>
  );
}
