'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getPageIcon } from '@/lib/ui/page-icons';
import { IconifyIcon } from '@/components/shared/IconifyIcon';
import { PageHeaderLayout } from '@/components/shared/PageHeaderLayout';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  /** compact = text-lg (Suppliers-style); default = text-xl (ListToolbar-style) */
  size?: 'default' | 'compact';
  className?: string;
  layout?: 'split' | 'title-only';
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  size = 'compact',
  className = '',
  layout = 'split',
}: PageHeaderProps) {
  const pathname = usePathname();
  const resolvedIcon = icon ?? getPageIcon(pathname);

  const titleBlock = (
    <PageHeaderLayout
      size={size}
      title={title}
      subtitle={subtitle}
      icon={
        resolvedIcon ? (
          <IconifyIcon icon={resolvedIcon} width={32} height={32} />
        ) : undefined
      }
    />
  );

  if (layout === 'title-only') {
    return <div className={className}>{titleBlock}</div>;
  }

  return (
    <div
      className={`flex flex-row items-start justify-between gap-2 min-h-[3rem] ${className}`.trim()}
    >
      <div className="min-w-0 flex-1">{titleBlock}</div>
      <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2 shrink-0 self-start min-h-[2.25rem] max-sm:[&_button]:px-2.5 max-sm:[&_button]:text-[10px]">
        {actions ?? null}
      </div>
    </div>
  );
}
