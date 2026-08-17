'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { DateInput } from '@/components/shared/DateInput';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import {
  PendingImageUploadContext,
  type PendingImageSetter,
} from '@/components/shared/pending-image-upload-context';
import { SubmitBusyLabel, useSubmitGuard } from '@/hooks/use-submit-guard';
import { publicIdFieldKey } from '@/lib/services/cloudinary-service';
import type { PortField } from '@/lib/modules/port-types';
import { MODULE_FORM_SHELL } from '@/lib/ui/module-layout';
import {
  FORM_BTN_PRIMARY,
  FORM_BTN_SECONDARY,
  FORM_CARD_CLS,
  FORM_FOOTER_CLS,
  FORM_GRID_CLS,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
  FORM_MODAL_BACKDROP_CLS,
  FORM_MODAL_BACKDROP_INNER_CLS,
  FORM_MODAL_BODY_CLS,
  FORM_MODAL_FOOTER_CLS,
  FORM_MODAL_HEADER_CLS,
  FORM_MODAL_PANEL_CLS,
  FORM_MODAL_SIZE_CLS,
  FORM_SELECT_CLS,
  FORM_TEXTAREA_CLS,
} from '@/lib/ui/form-styles';

const MAX_WIDTH_CLS = {
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const;

export type AppFormShellProps = {
  title: string;
  subtitle?: string;
  titleId?: string;
  onCancel: () => void;
  onSubmit: (e: FormEvent) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  hideFooter?: boolean;
  variant?: 'page' | 'modal';
  onPendingUpload?: PendingImageSetter;
};

export function AppFormShell({
  title,
  subtitle,
  titleId,
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  children,
  footer,
  hideFooter = false,
  variant = 'page',
  onPendingUpload,
}: AppFormShellProps) {
  const { isSubmitting, guardSubmit } = useSubmitGuard();
  const onPendingUploadRef = useRef(onPendingUpload);
  onPendingUploadRef.current = onPendingUpload;

  const setPending = useCallback<PendingImageSetter>((promise) => {
    onPendingUploadRef.current?.(promise);
  }, []);

  useEffect(() => () => {
    onPendingUploadRef.current?.(null);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void guardSubmit(async () => {
      await Promise.resolve(onSubmit(e));
    });
  };

  const defaultFooter = (
    <div className={variant === 'modal' ? FORM_MODAL_FOOTER_CLS : FORM_FOOTER_CLS}>
      <button type="button" onClick={onCancel} className={FORM_BTN_SECONDARY}>
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className={`${FORM_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center`}
      >
        <SubmitBusyLabel busy={isSubmitting} idle={submitLabel} />
      </button>
    </div>
  );

  if (variant === 'modal') {
    return (
      <PendingImageUploadContext.Provider value={setPending}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className={FORM_MODAL_HEADER_CLS}>
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
              {subtitle ? (
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-2.5 bg-white/60 hover:bg-white/90 border border-white/80 rounded-2xl shadow-xs text-slate-700 hover:text-slate-900 cursor-pointer shrink-0 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className={FORM_MODAL_BODY_CLS}>{children}</div>
          {!hideFooter && (footer ?? defaultFooter)}
        </form>
      </PendingImageUploadContext.Provider>
    );
  }

  return (
    <PendingImageUploadContext.Provider value={setPending}>
      <form onSubmit={handleSubmit} className={FORM_CARD_CLS}>
        {children}
        {!hideFooter && (footer ?? defaultFooter)}
      </form>
    </PendingImageUploadContext.Provider>
  );
}

export type AppFormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId?: string;
  onSubmit: (e: FormEvent) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  size?: keyof typeof FORM_MODAL_SIZE_CLS;
  children: ReactNode;
  footer?: ReactNode;
  hideFooter?: boolean;
  onPendingUpload?: PendingImageSetter;
};

export function AppFormModal({
  open,
  onClose,
  title,
  subtitle,
  titleId,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  size = 'md',
  children,
  footer,
  hideFooter = false,
  onPendingUpload,
}: AppFormModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={FORM_MODAL_BACKDROP_CLS}>
      <button
        type="button"
        className={FORM_MODAL_BACKDROP_INNER_CLS}
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId ?? 'app-form-modal-title'}
        className={`${FORM_MODAL_PANEL_CLS} ${FORM_MODAL_SIZE_CLS[size]}`}
      >
        <AppFormShell
          title={title}
          subtitle={subtitle}
          titleId={titleId ?? 'app-form-modal-title'}
          onCancel={onClose}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
          footer={footer}
          hideFooter={hideFooter}
          variant="modal"
          onPendingUpload={onPendingUpload}
        >
          {children}
        </AppFormShell>
      </div>
    </div>
  );
}

export type AppFormPageProps = {
  title: string;
  subtitle?: string;
  titleId?: string;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: keyof typeof MAX_WIDTH_CLS;
  children: ReactNode;
  footer?: ReactNode;
  hideFooter?: boolean;
  onPendingUpload?: PendingImageSetter;
};

export function AppFormPage({
  title,
  subtitle,
  titleId,
  onBack,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  children,
  footer,
  hideFooter = false,
  onPendingUpload,
}: AppFormPageProps) {
  return (
    <div className={MODULE_FORM_SHELL}>
      <div className="w-full flex flex-col min-h-full pb-4 space-y-4">
        <FormHeader title={title} subtitle={subtitle} titleId={titleId} onBack={onBack} compact />
        <AppFormShell
          title={title}
          subtitle={subtitle}
          titleId={titleId}
          onCancel={onBack}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
          footer={footer}
          hideFooter={hideFooter}
          variant="page"
          onPendingUpload={onPendingUpload}
        >
          {children}
        </AppFormShell>
      </div>
      <Footer />
    </div>
  );
}

export function AppFormFieldInput({
  field,
  value,
  onChange,
}: {
  field: PortField;
  value: string;
  onChange: (v: string, publicId?: string) => void;
}) {
  const isRequired = field.required && field.type !== 'email';

  if (field.type === 'select' && field.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={isRequired}
        className={FORM_SELECT_CLS}
      >
        {field.placeholder && <option value="">{field.placeholder}</option>}
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={isRequired}
        placeholder={field.placeholder}
        className={FORM_TEXTAREA_CLS}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <DateInput
        value={value}
        onChange={onChange}
        required={isRequired}
        className={`${FORM_INPUT_CLS} cursor-pointer`}
      />
    );
  }

  if (field.type === 'image') {
    return (
      <ImageUploadField
        label={field.label}
        value={value}
        onChange={onChange}
      />
    );
  }

  const inputType =
    field.type === 'number'
      ? 'number'
      : field.type === 'email'
        ? 'email'
        : field.type === 'phone'
          ? 'tel'
          : 'text';

  return (
    <input
      type={inputType}
      required={isRequired}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={FORM_INPUT_CLS}
    />
  );
}

export type AppFormFieldsProps = {
  fields: PortField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  columns?: 1 | 2;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
};

export function AppFormFields({
  fields,
  values,
  onChange,
  columns = 2,
  showAdvanced: controlledShowAdvanced,
  onToggleAdvanced,
}: AppFormFieldsProps) {
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false);
  const showAdvanced = controlledShowAdvanced ?? internalShowAdvanced;
  const toggleAdvanced =
    onToggleAdvanced ?? (() => setInternalShowAdvanced((prev) => !prev));

  const basicFields = useMemo(() => fields.filter((f) => !f.advanced), [fields]);
  const advancedFields = useMemo(() => fields.filter((f) => f.advanced), [fields]);
  const gridCls = columns === 1 ? 'grid grid-cols-1 gap-y-5 text-xs font-semibold text-slate-700' : FORM_GRID_CLS;

  const renderField = (field: PortField) => (
    <div key={field.key} className={field.type === 'textarea' || field.type === 'image' ? 'md:col-span-2' : ''}>
      {field.type !== 'image' ? (
        <label className={FORM_LABEL_CLS}>
          {field.label}
          {field.required ? <span className="text-rose-500 normal-case"> *</span> : null}
        </label>
      ) : null}
      <AppFormFieldInput
        field={field}
        value={values[field.key] ?? ''}
        onChange={(v, publicId) => {
          onChange(field.key, v);
          if (field.type === 'image') onChange(publicIdFieldKey(field.key), publicId ?? '');
        }}
      />
    </div>
  );

  return (
    <>
      <div className={gridCls}>{basicFields.map(renderField)}</div>
      {advancedFields.length > 0 && (
        <AdvancedDetailsToggle open={showAdvanced} onToggle={toggleAdvanced} />
      )}
      {showAdvanced && advancedFields.length > 0 && (
        <div className={`${gridCls} pt-4 border-t border-slate-100/80`}>
          {advancedFields.map(renderField)}
        </div>
      )}
    </>
  );
}

export {
  FORM_BTN_PRIMARY,
  FORM_BTN_SECONDARY,
  FORM_CARD_CLS,
  FORM_FOOTER_CLS,
  FORM_GRID_CLS,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
  FORM_MODAL_BODY_CLS,
  FORM_MODAL_FOOTER_CLS,
  FORM_MODAL_HEADER_CLS,
  FORM_SELECT_CLS,
  FORM_TEXTAREA_CLS,
};
