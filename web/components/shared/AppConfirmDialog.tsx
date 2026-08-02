'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFeedbackStore } from '@/lib/ui/feedback-store';
import {
  FORM_BTN_PRIMARY,
  FORM_BTN_SECONDARY,
  FORM_MODAL_BACKDROP_CLS,
  FORM_MODAL_BACKDROP_INNER_CLS,
  FORM_MODAL_FOOTER_CLS,
  FORM_MODAL_HEADER_CLS,
  FORM_MODAL_PANEL_CLS,
  FORM_MODAL_SIZE_CLS,
} from '@/lib/ui/form-styles';

export function AppConfirmDialog() {
  const confirm = useFeedbackStore((s) => s.confirm);
  const resolveConfirm = useFeedbackStore((s) => s.resolveConfirm);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirm.open) {
      const timer = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [confirm.open]);

  useEffect(() => {
    if (!confirm.open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirm.open, resolveConfirm]);

  if (!confirm.open) return null;

  const confirmBtnClass =
    confirm.tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all'
      : FORM_BTN_PRIMARY;

  return (
    <div className={FORM_MODAL_BACKDROP_CLS} role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">
      <button
        type="button"
        className={FORM_MODAL_BACKDROP_INNER_CLS}
        aria-label="Cancel"
        onClick={() => resolveConfirm(false)}
      />
      <div className={`${FORM_MODAL_PANEL_CLS} ${FORM_MODAL_SIZE_CLS.sm}`}>
        <div className={FORM_MODAL_HEADER_CLS}>
          <div className="flex items-start gap-3 min-w-0">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${confirm.tone === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              {confirm.module ? (
                <span className="inline-block mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {confirm.module}
                </span>
              ) : null}
              <h2 id="app-confirm-title" className="text-base font-extrabold text-slate-900 tracking-tight">
                {confirm.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{confirm.message}</p>
            </div>
          </div>
        </div>
        <div className={FORM_MODAL_FOOTER_CLS}>
          <button type="button" onClick={() => resolveConfirm(false)} className={FORM_BTN_SECONDARY}>
            {confirm.cancelLabel}
          </button>
          <button ref={confirmBtnRef} type="button" onClick={() => resolveConfirm(true)} className={confirmBtnClass}>
            {confirm.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
