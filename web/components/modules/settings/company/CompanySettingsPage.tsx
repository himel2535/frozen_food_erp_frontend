'use client';

import { toast } from '@/lib/ui/feedback';
import { useMemo, useState, type FormEvent } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { CompanySettingsForm, type CompanyFormState } from '@/components/modules/settings/company/CompanySettingsForm';
import { CompanySettingsOverview } from '@/components/modules/settings/company/CompanySettingsOverview';
import {
  companyToForm,
  sectionPayload,
  type CompanyEditSection,
} from '@/components/modules/settings/company/company-form-utils';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FORM_BTN_PRIMARY, FORM_BTN_SECONDARY } from '@/lib/ui/form-styles';
import { ST_FORM_FOOTER } from '@/components/modules/settings/settings-styles';
import {
  getCompanyDocuments,
  getCompanyProfile,
  updateCompanyProfile,
} from '@/lib/services/settings-service';
import { useAppStore } from '@/lib/state/app-store';

function editTitle(section: CompanyEditSection, labels: Record<string, string>) {
  if (section === 'identity') return labels.editIdentityTitle;
  if (section === 'business') return labels.editBusinessTitle;
  if (section === 'tax') return labels.editTaxTitle;
  if (section === 'preferences') return labels.editPreferencesTitle;
  return labels.editAllTitle;
}

export function CompanySettingsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const t = useAppStore((s) => s.t);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [editSection, setEditSection] = useState<CompanyEditSection>('all');
  const [, bump] = useState(0);
  const [form, setForm] = useState<CompanyFormState>(() => companyToForm(getCompanyProfile(appState)));

  const profile = useMemo(() => getCompanyProfile(appState), [appState, bump]);
  const documents = useMemo(() => getCompanyDocuments(appState), [appState, bump]);

  const labels = useMemo(
    () => ({
      identitySection: t('settings.company_information'),
      businessSection: t('settings.company_business'),
      taxSection: t('settings.company_tax_compliance'),
      preferencesSection: t('settings.company_system_preferences'),
      brandingSection: t('settings.company_branding'),
      displayName: t('settings.company_display_name'),
      legalName: t('settings.company_legal_name'),
      industry: t('settings.company_industry'),
      registrationNo: t('settings.company_registration'),
      establishedYear: t('settings.company_established'),
      phone: t('settings.company_phone'),
      email: t('settings.company_email'),
      emailOptional: t('settings.company_email_optional'),
      website: t('settings.company_website'),
      currency: t('settings.company_currency'),
      timezone: t('settings.company_timezone'),
      fiscalYearStart: t('settings.company_fiscal_year'),
      taxId: t('settings.company_tax_id'),
      vatNumber: t('settings.company_vat'),
      street: t('settings.company_street'),
      city: t('settings.company_city'),
      state: t('settings.company_state'),
      postalCode: t('settings.company_postal'),
      country: t('settings.company_country'),
      invoicePrefix: t('settings.company_invoice_prefix'),
      letterheadFooter: t('settings.company_letterhead'),
      paymentTermsNote: t('settings.company_payment_terms'),
      dateFormat: t('settings.company_date_format'),
      currencySymbol: t('settings.company_currency_symbol'),
      numberFormat: t('settings.company_number_format'),
      language: t('settings.company_language_label'),
      itemsPerPage: t('settings.company_items_per_page'),
      theme: t('settings.company_theme'),
      defaultLandingPage: t('settings.company_default_landing'),
      notificationEmail: t('settings.company_notification_email'),
      autoBackup: t('settings.company_auto_backup'),
      sessionTimeout: t('settings.company_session_timeout'),
      twoFactor: t('settings.company_two_factor'),
      companyAddress: t('settings.company_address'),
      enabled: t('settings.company_enabled'),
      disabled: t('settings.company_disabled'),
      minutes: t('settings.company_minutes'),
      save: t('settings.save_changes'),
      cancel: t('settings.company_cancel'),
      saved: t('settings.company_saved'),
      editAll: t('settings.company_edit_all'),
      editIdentity: t('settings.company_edit_identity'),
      editBusiness: t('settings.company_edit_business'),
      editTax: t('settings.company_edit_tax'),
      editPreferences: t('settings.company_edit_preferences'),
      editAllTitle: t('settings.company_edit_all_title'),
      editIdentityTitle: t('settings.company_edit_identity_title'),
      editBusinessTitle: t('settings.company_edit_business_title'),
      editTaxTitle: t('settings.company_edit_tax_title'),
      editPreferencesTitle: t('settings.company_edit_preferences_title'),
      back: t('settings.company_back'),
      editSubtitle: t('settings.company_edit_subtitle'),
      documentsTitle: t('settings.company_documents_title'),
      documentsSubtitle: t('settings.company_documents_subtitle'),
      uploadDocument: t('settings.company_upload_document'),
      documentUploaded: t('settings.company_document_uploaded'),
    }),
    [t],
  );

  const openEdit = (section: CompanyEditSection) => {
    setForm(companyToForm(getCompanyProfile(appState)));
    setEditSection(section);
    setView('form');
  };

  const closeForm = () => {
    setView('main');
  };

  const onChange = (key: keyof CompanyFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((editSection === 'all' || editSection === 'identity') && !form.name.trim()) {
      toast.error('Validation failed', { module: 'Company Settings', description: 'Company name is required.' });
      return;
    }

    updateCompanyProfile(appState, sectionPayload(editSection, form));
    saveAppState();
    bump((n) => n + 1);
    toast.success(labels.saved, { module: 'Company Settings' });
    closeForm();
  };

  if (view === 'form') {
    return (
      <div className={MODULE_LIST_SHELL}>
        <form onSubmit={handleSubmit} className="w-full flex flex-col min-h-full pb-4">
          <div className="pt-3 md:pt-4 mb-3">
            <FormHeader
              compact
              title={editTitle(editSection, labels)}
              subtitle={labels.editSubtitle}
              onBack={closeForm}
              backLabel={labels.back}
            />
          </div>
          <CompanySettingsForm section={editSection} form={form} onChange={onChange} labels={labels} />
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
      <CompanySettingsOverview
        profile={profile}
        documents={documents}
        labels={labels}
        onEditAll={() => openEdit('all')}
        onEditSection={openEdit}
      />
      <Footer />
    </div>
  );
}
