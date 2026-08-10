'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { FormHeader } from '@/components/layout/FormHeader';
import { SignatureSettingsForm } from '@/components/modules/settings/signatures/SignatureSettingsForm';
import { SignatureSettingsOverview } from '@/components/modules/settings/signatures/SignatureSettingsOverview';
import {
  EMPTY_SIGNATURE_FORM,
  formToSignatureInput,
  signatureToForm,
  type SignatureFormState,
} from '@/components/modules/settings/signatures/signature-form-utils';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FORM_BTN_PRIMARY, FORM_BTN_SECONDARY } from '@/lib/ui/form-styles';
import { ST_FORM_FOOTER } from '@/components/modules/settings/settings-styles';
import {
  createCompanySignature,
  deleteCompanySignature,
  getCompanySignatures,
  getSignatureById,
  getSignatureMetrics,
  setDefaultCompanySignature,
  updateCompanySignature,
} from '@/lib/services/settings-service';
import { useAppStore } from '@/lib/state/app-store';

export function SignatureSettingsPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const t = useAppStore((s) => s.t);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, bump] = useState(0);
  const [form, setForm] = useState<SignatureFormState>(EMPTY_SIGNATURE_FORM);

  const signatures = useMemo(() => getCompanySignatures(appState), [appState, bump]);
  const metrics = useMemo(() => getSignatureMetrics(appState), [appState, bump]);

  useChromeSuppressed(view === 'form');

  const labels = useMemo(
    () => ({
      subtitle: t('settings.signatures_subtitle'),
      add: t('settings.signatures_add'),
      edit: t('settings.signatures_edit'),
      delete: t('settings.signatures_delete'),
      default: t('settings.signatures_default'),
      setDefault: t('settings.signatures_set_default'),
      kpiTotal: t('settings.signatures_kpi_total'),
      kpiDefault: t('settings.signatures_kpi_default'),
      noDefault: t('settings.signatures_no_default'),
      emptyTitle: t('settings.signatures_empty_title'),
      emptyHint: t('settings.signatures_empty_hint'),
      save: t('settings.save_changes'),
      cancel: t('settings.signatures_cancel'),
      saved: t('settings.signatures_saved'),
      deleted: t('settings.signatures_deleted'),
      editTitle: t('settings.signatures_edit_title'),
      createTitle: t('settings.signatures_create_title'),
      formSubtitle: t('settings.signatures_form_subtitle'),
      back: t('settings.signatures_back'),
      uploadTitle: t('settings.signatures_upload_title'),
      uploadHint: t('settings.signatures_upload_hint'),
      uploadReplace: t('settings.signatures_upload_replace'),
      uploadRemove: t('settings.signatures_upload_remove'),
      uploadInvalid: t('settings.signatures_upload_invalid'),
      uploadTooLarge: t('settings.signatures_upload_too_large'),
      labelField: t('settings.signatures_label'),
      labelPlaceholder: t('settings.signatures_label_placeholder'),
      signerName: t('settings.signatures_signer_name'),
      signerNamePlaceholder: t('settings.signatures_signer_name_placeholder'),
      designation: t('settings.signatures_designation'),
      designationPlaceholder: t('settings.signatures_designation_placeholder'),
      setDefaultHint: t('settings.signatures_set_default_hint'),
      previewTitle: t('settings.signatures_preview_title'),
      previewAuthorized: t('settings.signatures_preview_authorized'),
      previewDate: t('settings.signatures_preview_date'),
      deleteConfirm: t('settings.signatures_delete_confirm'),
      goInvoice: t('settings.signatures_go_invoice'),
      goInvoiceHint: t('settings.signatures_go_invoice_hint'),
      goInvoiceToast: t('settings.signatures_go_invoice_toast'),
      goInvoiceToastDesc: t('settings.signatures_go_invoice_toast_desc'),
      goInvoiceDisabled: t('settings.signatures_go_invoice_disabled'),
    }),
    [t],
  );

  const handleGoInvoice = () => {
    if (signatures.length === 0) return;
    toast.info(labels.goInvoiceToast, {
      module: 'Signatures',
      description: labels.goInvoiceToastDesc,
    });
    router.push('/sales/invoices?create=1&signature=1');
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_SIGNATURE_FORM);
    setView('form');
  };

  const openEdit = (id: string) => {
    const signature = getSignatureById(appState, id);
    if (!signature) return;
    setEditingId(id);
    setForm(signatureToForm(signature));
    setView('form');
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(EMPTY_SIGNATURE_FORM);
    setView('main');
  };

  const onChange = (key: keyof SignatureFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input = formToSignatureInput(form);
    const result = editingId
      ? updateCompanySignature(appState, editingId, input)
      : createCompanySignature(appState, input);

    if (!result.ok) {
      toast.error('Validation failed', {
        module: 'Signatures',
        description: 'error' in result ? String(result.error) : 'Save failed',
      });
      return;
    }

    saveAppState();
    bump((n) => n + 1);
    toast.success(labels.saved, { module: 'Signatures' });
    closeForm();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: labels.delete,
      message: labels.deleteConfirm,
      confirmLabel: labels.delete,
      tone: 'danger',
      module: 'Signatures',
    });
    if (!ok) return;

    const result = deleteCompanySignature(appState, id);
    if (!result.ok) {
      toast.error('Operation failed', {
        module: 'Signatures',
        description: 'error' in result ? String(result.error) : 'Delete failed',
      });
      return;
    }

    saveAppState();
    bump((n) => n + 1);
    toast.success(labels.deleted, { module: 'Signatures' });
  };

  const handleSetDefault = (id: string) => {
    const result = setDefaultCompanySignature(appState, id);
    if (!result.ok) {
      toast.error('Operation failed', {
        module: 'Signatures',
        description: 'error' in result ? String(result.error) : 'Update failed',
      });
      return;
    }
    saveAppState();
    bump((n) => n + 1);
    toast.success(labels.saved, { module: 'Signatures' });
  };

  if (view === 'form') {
    return (
      <div className={MODULE_LIST_SHELL}>
        <form onSubmit={handleSubmit} className="w-full flex flex-col min-h-full pb-4">
          <div className="pt-3 md:pt-4 mb-3">
            <FormHeader
              compact
              title={editingId ? labels.editTitle : labels.createTitle}
              subtitle={labels.formSubtitle}
              onBack={closeForm}
              backLabel={labels.back}
            />
          </div>
          <SignatureSettingsForm form={form} onChange={onChange} labels={labels} />
          <div className={ST_FORM_FOOTER}>
            <button type="button" onClick={closeForm} className={FORM_BTN_SECONDARY}>
              {labels.cancel}
            </button>
            <button type="submit" className={FORM_BTN_PRIMARY}>
              {labels.save}
            </button>
          </div>
        </form>
        <Footer />
      </div>
    );
  }

  return (
    <div className={MODULE_LIST_SHELL}>
      <SignatureSettingsOverview
        signatures={signatures}
        metrics={metrics}
        labels={labels}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
        onGoInvoice={handleGoInvoice}
        canGoInvoice={signatures.length > 0}
      />
      <Footer />
    </div>
  );
}
