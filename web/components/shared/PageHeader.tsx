'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getPageIcon } from '@/lib/ui/page-icons';
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
          <Icon icon={resolvedIcon} width={32} height={32} />
        ) : undefined
      }
    />
  );

  if (layout === 'title-only') {
    return <div className={className}>{titleBlock}</div>;
  }

  return (
    <div
      className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 ${className}`.trim()}
    >
      {titleBlock}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-center shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
