'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
  Ban,
  CheckCircle,
  Eye,
  ListTree,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';

export type TableIconActionVariant =
  | 'edit'
  | 'delete'
  | 'view'
  | 'approve'
  | 'discontinue'
  | 'restore'
  | 'bom';

const VARIANT_CONFIG: Record<
  TableIconActionVariant,
  { icon: ReactNode; label: string; className: string }
> = {
  edit: {
    icon: <Pencil className="w-4 h-4" />,
    label: 'Edit',
    className: 'app-table-icon-btn app-table-icon-btn--edit',
  },
  delete: {
    icon: <Trash2 className="w-4 h-4" />,
    label: 'Delete',
    className: 'app-table-icon-btn app-table-icon-btn--delete',
  },
  view: {
    icon: <Eye className="w-4 h-4" />,
    label: 'View',
    className: 'app-table-icon-btn app-table-icon-btn--view',
  },
  approve: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Approve',
    className: 'app-table-icon-btn app-table-icon-btn--approve',
  },
  discontinue: {
    icon: <Ban className="w-4 h-4" />,
    label: 'Discontinue',
    className: 'app-table-icon-btn app-table-icon-btn--discontinue',
  },
  restore: {
    icon: <RotateCcw className="w-4 h-4" />,
    label: 'Restore',
    className: 'app-table-icon-btn app-table-icon-btn--restore',
  },
  bom: {
    icon: <ListTree className="w-4 h-4" />,
    label: 'Manage BOM',
    className: 'app-table-icon-btn app-table-icon-btn--bom',
  },
};

type TableIconActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant: TableIconActionVariant;
  label?: string;
};

export function TableIconAction({ variant, label, className = '', ...props }: TableIconActionProps) {
  const config = VARIANT_CONFIG[variant];
  const ariaLabel = label ?? config.label;

  return (
    <button
      type="button"
      title={ariaLabel}
      aria-label={ariaLabel}
      className={`${config.className} ${className}`.trim()}
      {...props}
    >
      {config.icon}
    </button>
  );
}
