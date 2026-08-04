'use client';

import { ArrowLeft } from 'lucide-react';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import { getPageIcon } from '@/lib/ui/page-icons';
import { PageHeaderLayout } from '@/components/shared/PageHeaderLayout';

interface FormHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  titleId?: string;
  compact?: boolean;
  icon?: string;
}

export function FormHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  titleId,
  compact = false,
  icon,
}: FormHeaderProps) {
  const pathname = usePathname();
  const resolvedIcon = icon ?? getPageIcon(pathname);

  return (
    <div className={`flex items-start gap-3 ${compact ? 'mb-3' : 'mb-6'}`}>
      <button
        type="button"
        onClick={onBack}
        className="p-2.5 bg-white/60 hover:bg-white/90 border border-white/80 rounded-2xl shadow-xs transition-all text-slate-700 hover:text-slate-900 cursor-pointer shrink-0"
        title={backLabel ?? 'Back'}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="min-w-0 flex-1">
        {backLabel ? (
          <p className="text-[11px] font-bold text-slate-500 mb-1">{backLabel}</p>
        ) : null}
        <PageHeaderLayout
          size="compact"
          title={<span id={titleId}>{title}</span>}
          subtitle={subtitle}
          icon={
            resolvedIcon ? (
              <Icon icon={resolvedIcon} width={32} height={32} />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
