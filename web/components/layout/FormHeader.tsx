'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getPageIcon } from '@/lib/ui/page-icons';
import { IconifyIcon } from '@/components/shared/IconifyIcon';
import { PageHeaderLayout } from '@/components/shared/PageHeaderLayout';
import { FORM_BACK_BTN_CLS } from '@/lib/ui/form-styles';

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
  const label = backLabel ?? 'Back';

  return (
    <header className={compact ? 'mb-3' : 'mb-5'}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className={FORM_BACK_BTN_CLS}
          title={label}
          aria-label={label}
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
        </button>

        <div className="min-w-0 flex-1">
          <PageHeaderLayout
            size="compact"
            title={<span id={titleId}>{title}</span>}
            subtitle={subtitle}
            icon={
              resolvedIcon ? (
                <IconifyIcon icon={resolvedIcon} width={32} height={32} />
              ) : undefined
            }
          />
        </div>
      </div>
    </header>
  );
}
