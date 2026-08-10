'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useFeedbackStore } from '@/lib/ui/feedback-store';
import {
  FORM_BTN_PRIMARY,
  FORM_BTN_SECONDARY,
  FORM_INPUT_CLS,
  FORM_MODAL_BACKDROP_CLS,
  FORM_MODAL_BACKDROP_INNER_CLS,
  FORM_MODAL_BODY_CLS,
  FORM_MODAL_FOOTER_CLS,
  FORM_MODAL_HEADER_CLS,
  FORM_MODAL_PANEL_CLS,
  FORM_MODAL_SIZE_CLS,
} from '@/lib/ui/form-styles';

export function AppPromptDialog() {
  const prompt = useFeedbackStore((s) => s.prompt);
  const resolvePrompt = useFeedbackStore((s) => s.resolvePrompt);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (prompt.open) {
      setValue(prompt.defaultValue);
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [prompt.open, prompt.defaultValue]);

  useEffect(() => {
    if (!prompt.open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolvePrompt(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [prompt.open, resolvePrompt]);

  if (!prompt.open) return null;

  const submit = () => resolvePrompt(value);

  return (
    <div className={FORM_MODAL_BACKDROP_CLS} role="dialog" aria-modal="true" aria-labelledby="app-prompt-title">
      <button
        type="button"
        className={FORM_MODAL_BACKDROP_INNER_CLS}
        aria-label="Cancel"
        onClick={() => resolvePrompt(null)}
      />
      <div className={`${FORM_MODAL_PANEL_CLS} ${FORM_MODAL_SIZE_CLS.sm}`}>
        <div className={FORM_MODAL_HEADER_CLS}>
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MessageSquareText className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              {prompt.module ? (
                <span className="inline-block mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  {prompt.module}
                </span>
              ) : null}
              <h2 id="app-prompt-title" className="text-base font-extrabold text-slate-900 tracking-tight">
                {prompt.title}
              </h2>
              {prompt.message ? (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{prompt.message}</p>
              ) : null}
            </div>
          </div>
        </div>
        <form
          className={FORM_MODAL_BODY_CLS}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            type={prompt.inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={prompt.placeholder}
            className={FORM_INPUT_CLS}
            step={prompt.inputType === 'number' ? 'any' : undefined}
          />
        </form>
        <div className={FORM_MODAL_FOOTER_CLS}>
          <button type="button" onClick={() => resolvePrompt(null)} className={FORM_BTN_SECONDARY}>
            {prompt.cancelLabel}
          </button>
          <button type="button" onClick={submit} className={FORM_BTN_PRIMARY}>
            {prompt.okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
