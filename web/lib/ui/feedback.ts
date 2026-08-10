import {
  useFeedbackStore,
  type ConfirmTone,
  type PromptInputType,
  type ToastVariant,
} from './feedback-store';

export type ToastOptions = {
  description?: string;
  module?: string;
  durationMs?: number;
};

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  module?: string;
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
  warning: 5000,
};

function showToast(variant: ToastVariant, title: string, opts?: ToastOptions) {
  if (typeof window === 'undefined') return;
  useFeedbackStore.getState().pushToast({
    variant,
    title,
    description: opts?.description,
    module: opts?.module,
    durationMs: opts?.durationMs ?? DEFAULT_DURATION[variant],
  });
}

export const toast = {
  success: (title: string, opts?: ToastOptions) => showToast('success', title, opts),
  error: (title: string, opts?: ToastOptions) => showToast('error', title, opts),
  info: (title: string, opts?: ToastOptions) => showToast('info', title, opts),
  warning: (title: string, opts?: ToastOptions) => showToast('warning', title, opts),
};

export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return useFeedbackStore.getState().openConfirm({
    title: opts.title,
    message: opts.message,
    confirmLabel: opts.confirmLabel ?? 'Confirm',
    cancelLabel: opts.cancelLabel ?? 'Cancel',
    tone: opts.tone ?? 'primary',
    module: opts.module,
  });
}

export type PromptOptions = {
  title?: string;
  message?: string;
  okLabel?: string;
  cancelLabel?: string;
  module?: string;
  inputType?: PromptInputType;
  placeholder?: string;
};

export function promptAction(
  title: string,
  defaultValue = '',
  options?: PromptOptions,
): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return useFeedbackStore.getState().openPrompt({
    title,
    message: options?.message ?? '',
    defaultValue,
    okLabel: options?.okLabel ?? 'OK',
    cancelLabel: options?.cancelLabel ?? 'Cancel',
    inputType: options?.inputType ?? 'text',
    placeholder: options?.placeholder,
    module: options?.module,
  });
}
