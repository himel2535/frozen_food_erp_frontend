'use client';

import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useFeedbackStore, type ToastItem, type ToastVariant } from '@/lib/ui/feedback-store';

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; bg: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/95',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  error: {
    border: 'border-rose-200',
    bg: 'bg-rose-50/95',
    icon: XCircle,
    iconClass: 'text-rose-600',
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50/95',
    icon: Info,
    iconClass: 'text-blue-600',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/95',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
  },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const style = VARIANT_STYLES[item.variant];
  const Icon = style.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => window.clearTimeout(timer);
  }, [item.id, item.durationMs, onDismiss]);

  return (
    <div
      role="status"
      className={`app-toast-enter pointer-events-auto w-full max-w-sm rounded-xl border shadow-lg backdrop-blur-sm ${style.border} ${style.bg} p-3`}
    >
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconClass}`} />
        <div className="min-w-0 flex-1">
          {item.module ? (
            <span className="inline-block mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500 bg-white/70 border border-slate-200/80 rounded px-1.5 py-0.5">
              {item.module}
            </span>
          ) : null}
          <p className="text-xs font-extrabold text-slate-900 leading-snug">{item.title}</p>
          {item.description ? (
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(item.id)}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AppToastHost() {
  const toasts = useFeedbackStore((s) => s.toasts);
  const dismissToast = useFeedbackStore((s) => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-[min(100vw-2rem,24rem)] pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
