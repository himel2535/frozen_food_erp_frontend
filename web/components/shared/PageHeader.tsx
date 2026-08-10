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
      className={`flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 min-h-[3.75rem] ${className}`.trim()}
    >
      {titleBlock}
      <div className="flex flex-wrap items-center justify-end gap-2 self-start shrink-0 min-w-[280px] min-h-[2.625rem]">
        {actions ?? null}
      </div>
    </div>
  );
}
