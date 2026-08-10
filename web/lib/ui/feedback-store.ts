import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  module?: string;
  durationMs: number;
};

export type ConfirmTone = 'primary' | 'danger';

export type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmTone;
  module?: string;
  resolve: ((value: boolean) => void) | null;
};

export type PromptInputType = 'text' | 'number';

export type PromptState = {
  open: boolean;
  title: string;
  message: string;
  defaultValue: string;
  okLabel: string;
  cancelLabel: string;
  inputType: PromptInputType;
  placeholder?: string;
  module?: string;
  resolve: ((value: string | null) => void) | null;
};

type FeedbackState = {
  toasts: ToastItem[];
  confirm: ConfirmState;
  prompt: PromptState;
  pushToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;
  openConfirm: (opts: Omit<ConfirmState, 'open' | 'resolve'>) => Promise<boolean>;
  resolveConfirm: (value: boolean) => void;
  openPrompt: (opts: Omit<PromptState, 'open' | 'resolve'>) => Promise<string | null>;
  resolvePrompt: (value: string | null) => void;
};

const MAX_TOASTS = 5;

const defaultConfirm: ConfirmState = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'primary',
  module: undefined,
  resolve: null,
};

const defaultPrompt: PromptState = {
  open: false,
  title: '',
  message: '',
  defaultValue: '',
  okLabel: 'OK',
  cancelLabel: 'Cancel',
  inputType: 'text',
  placeholder: undefined,
  module: undefined,
  resolve: null,
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  toasts: [],
  confirm: defaultConfirm,
  prompt: defaultPrompt,

  pushToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }].slice(-MAX_TOASTS),
    }));
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  openConfirm: (opts) =>
    new Promise<boolean>((resolve) => {
      set({
        confirm: {
          ...opts,
          open: true,
          resolve,
        },
      });
    }),

  resolveConfirm: (value) => {
    const { confirm } = get();
    confirm.resolve?.(value);
    set({ confirm: { ...defaultConfirm } });
  },

  openPrompt: (opts) =>
    new Promise<string | null>((resolve) => {
      set({
        prompt: {
          ...opts,
          open: true,
          resolve,
        },
      });
    }),

  resolvePrompt: (value) => {
    const { prompt } = get();
    prompt.resolve?.(value);
    set({ prompt: { ...defaultPrompt } });
  },
}));
