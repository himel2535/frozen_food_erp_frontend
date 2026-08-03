'use client';

import { Building2, Globe, MapPin, Receipt, Settings } from 'lucide-react';
import type { CompanyEditSection } from '@/components/modules/settings/company/company-form-utils';
import {
  ST_CARD_COMPACT,
  ST_FORM_GRID,
  ST_FORM_STACK,
  ST_SECTION_HEADER_COMPACT,
  ST_TITLE,
} from '@/components/modules/settings/settings-styles';
import {
  FORM_GRID_CLS,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
  FORM_SELECT_CLS,
  FORM_TEXTAREA_CLS,
} from '@/lib/ui/form-styles';

export type CompanyFormState = {
  name: string;
  legalName: string;
  industry: string;
  registrationNo: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  fiscalYearStart: string;
  taxId: string;
  vatNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  invoicePrefix: string;
  letterheadFooter: string;
  paymentTermsNote: string;
  establishedYear: string;
  dateFormat: string;
  currencySymbol: string;
  numberFormat: string;
  language: string;
  itemsPerPage: string;
  theme: string;
  defaultLandingPage: string;
  notificationEmail: string;
  autoBackupEnabled: boolean;
  sessionTimeoutMinutes: string;
  twoFactorEnabled: boolean;
};

type CompanySettingsFormProps = {
  section: CompanyEditSection;
  form: CompanyFormState;
  onChange: (key: keyof CompanyFormState, value: string | boolean) => void;
  labels: Record<string, string>;
};

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={ST_CARD_COMPACT}>
      <div className={ST_SECTION_HEADER_COMPACT}>
        {icon}
        <h3 className={ST_TITLE}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
      />
    </label>
  );
}

function IdentityFields({
  form,
  onChange,
  labels,
}: {
  form: CompanyFormState;
  onChange: CompanySettingsFormProps['onChange'];
  labels: Record<string, string>;
}) {
  return (
    <SectionCard icon={<Building2 className="w-4 h-4 text-violet-500" />} title={labels.identitySection}>
      <div className={FORM_GRID_CLS}>
        <div>
          <label htmlFor="company-name" className={FORM_LABEL_CLS}>{labels.displayName}</label>
          <input id="company-name" type="text" required value={form.name} onChange={(e) => onChange('name', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-legal-name" className={FORM_LABEL_CLS}>{labels.legalName}</label>
          <input id="company-legal-name" type="text" value={form.legalName} onChange={(e) => onChange('legalName', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-industry" className={FORM_LABEL_CLS}>{labels.industry}</label>
          <input id="company-industry" type="text" value={form.industry} onChange={(e) => onChange('industry', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-registration" className={FORM_LABEL_CLS}>{labels.registrationNo}</label>
          <input id="company-registration" type="text" value={form.registrationNo} onChange={(e) => onChange('registrationNo', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-established" className={FORM_LABEL_CLS}>{labels.establishedYear}</label>
          <input id="company-established" type="text" value={form.establishedYear} onChange={(e) => onChange('establishedYear', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-phone" className={FORM_LABEL_CLS}>{labels.phone}</label>
          <input id="company-phone" type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-email" className={FORM_LABEL_CLS}>{labels.email}</label>
          <input id="company-email" type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} className={FORM_INPUT_CLS} placeholder={labels.emailOptional} />
        </div>
        <div>
          <label htmlFor="company-website" className={FORM_LABEL_CLS}>{labels.website}</label>
          <input id="company-website" type="text" value={form.website} onChange={(e) => onChange('website', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="company-street" className={FORM_LABEL_CLS}>{labels.street}</label>
          <input id="company-street" type="text" value={form.street} onChange={(e) => onChange('street', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-city" className={FORM_LABEL_CLS}>{labels.city}</label>
          <input id="company-city" type="text" value={form.city} onChange={(e) => onChange('city', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-state" className={FORM_LABEL_CLS}>{labels.state}</label>
          <input id="company-state" type="text" value={form.state} onChange={(e) => onChange('state', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-postal" className={FORM_LABEL_CLS}>{labels.postalCode}</label>
          <input id="company-postal" type="text" value={form.postalCode} onChange={(e) => onChange('postalCode', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-country" className={FORM_LABEL_CLS}>{labels.country}</label>
          <input id="company-country" type="text" value={form.country} onChange={(e) => onChange('country', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
      </div>
    </SectionCard>
  );
}

function BusinessFields({
  form,
  onChange,
  labels,
}: {
  form: CompanyFormState;
  onChange: CompanySettingsFormProps['onChange'];
  labels: Record<string, string>;
}) {
  return (
    <SectionCard icon={<Globe className="w-4 h-4 text-blue-500" />} title={labels.businessSection}>
      <div className={FORM_GRID_CLS}>
        <div>
          <label htmlFor="company-currency" className={FORM_LABEL_CLS}>{labels.currency}</label>
          <select id="company-currency" value={form.currency} onChange={(e) => onChange('currency', e.target.value)} className={FORM_SELECT_CLS}>
            <option value="BDT">BDT — Bangladeshi Taka</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
        </div>
        <div>
          <label htmlFor="company-timezone" className={FORM_LABEL_CLS}>{labels.timezone}</label>
          <select id="company-timezone" value={form.timezone} onChange={(e) => onChange('timezone', e.target.value)} className={FORM_SELECT_CLS}>
            <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </div>
        <div>
          <label htmlFor="company-fiscal-year" className={FORM_LABEL_CLS}>{labels.fiscalYearStart}</label>
          <select id="company-fiscal-year" value={form.fiscalYearStart} onChange={(e) => onChange('fiscalYearStart', e.target.value)} className={FORM_SELECT_CLS}>
            {['January', 'April', 'July', 'October'].map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="company-date-format" className={FORM_LABEL_CLS}>{labels.dateFormat}</label>
          <select id="company-date-format" value={form.dateFormat} onChange={(e) => onChange('dateFormat', e.target.value)} className={FORM_SELECT_CLS}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label htmlFor="company-currency-symbol" className={FORM_LABEL_CLS}>{labels.currencySymbol}</label>
          <input id="company-currency-symbol" type="text" value={form.currencySymbol} onChange={(e) => onChange('currencySymbol', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-number-format" className={FORM_LABEL_CLS}>{labels.numberFormat}</label>
          <input id="company-number-format" type="text" value={form.numberFormat} onChange={(e) => onChange('numberFormat', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-language" className={FORM_LABEL_CLS}>{labels.language}</label>
          <select id="company-language" value={form.language} onChange={(e) => onChange('language', e.target.value)} className={FORM_SELECT_CLS}>
            <option value="English">English</option>
            <option value="Bengali">Bengali</option>
          </select>
        </div>
        <div>
          <label htmlFor="company-items-page" className={FORM_LABEL_CLS}>{labels.itemsPerPage}</label>
          <input id="company-items-page" type="number" min={5} max={100} value={form.itemsPerPage} onChange={(e) => onChange('itemsPerPage', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-theme" className={FORM_LABEL_CLS}>{labels.theme}</label>
          <select id="company-theme" value={form.theme} onChange={(e) => onChange('theme', e.target.value)} className={FORM_SELECT_CLS}>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
            <option value="System">System</option>
          </select>
        </div>
        <div>
          <label htmlFor="company-landing-page" className={FORM_LABEL_CLS}>{labels.defaultLandingPage}</label>
          <select id="company-landing-page" value={form.defaultLandingPage} onChange={(e) => onChange('defaultLandingPage', e.target.value)} className={FORM_SELECT_CLS}>
            <option value="Dashboard">Dashboard</option>
            <option value="Sales">Sales</option>
            <option value="Inventory">Inventory</option>
            <option value="Purchases">Purchases</option>
          </select>
        </div>
      </div>
    </SectionCard>
  );
}

function TaxFields({
  form,
  onChange,
  labels,
}: {
  form: CompanyFormState;
  onChange: CompanySettingsFormProps['onChange'];
  labels: Record<string, string>;
}) {
  return (
    <SectionCard icon={<Receipt className="w-4 h-4 text-emerald-500" />} title={labels.taxSection}>
      <div className={FORM_GRID_CLS}>
        <div>
          <label htmlFor="company-tax-id" className={FORM_LABEL_CLS}>{labels.taxId}</label>
          <input id="company-tax-id" type="text" value={form.taxId} onChange={(e) => onChange('taxId', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-vat" className={FORM_LABEL_CLS}>{labels.vatNumber}</label>
          <input id="company-vat" type="text" value={form.vatNumber} onChange={(e) => onChange('vatNumber', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
      </div>
    </SectionCard>
  );
}

function PreferencesFields({
  form,
  onChange,
  labels,
}: {
  form: CompanyFormState;
  onChange: CompanySettingsFormProps['onChange'];
  labels: Record<string, string>;
}) {
  return (
    <SectionCard icon={<Settings className="w-4 h-4 text-amber-500" />} title={labels.preferencesSection}>
      <div className="space-y-4">
        <div className={FORM_GRID_CLS}>
          <div>
            <label htmlFor="company-notification-email" className={FORM_LABEL_CLS}>{labels.notificationEmail}</label>
            <input id="company-notification-email" type="email" value={form.notificationEmail} onChange={(e) => onChange('notificationEmail', e.target.value)} className={FORM_INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="company-session-timeout" className={FORM_LABEL_CLS}>{labels.sessionTimeout}</label>
            <input id="company-session-timeout" type="number" min={5} max={480} value={form.sessionTimeoutMinutes} onChange={(e) => onChange('sessionTimeoutMinutes', e.target.value)} className={FORM_INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="company-pref-landing" className={FORM_LABEL_CLS}>{labels.defaultLandingPage}</label>
            <select id="company-pref-landing" value={form.defaultLandingPage} onChange={(e) => onChange('defaultLandingPage', e.target.value)} className={FORM_SELECT_CLS}>
              <option value="Dashboard">Dashboard</option>
              <option value="Sales">Sales</option>
              <option value="Inventory">Inventory</option>
              <option value="Purchases">Purchases</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-slate-50 border-t border-slate-100 pt-2">
          <ToggleField label={labels.autoBackup} checked={form.autoBackupEnabled} onChange={(v) => onChange('autoBackupEnabled', v)} />
          <ToggleField label={labels.twoFactor} checked={form.twoFactorEnabled} onChange={(v) => onChange('twoFactorEnabled', v)} />
        </div>
      </div>
    </SectionCard>
  );
}

function BrandingFields({
  form,
  onChange,
  labels,
}: {
  form: CompanyFormState;
  onChange: CompanySettingsFormProps['onChange'];
  labels: Record<string, string>;
}) {
  return (
    <SectionCard icon={<MapPin className="w-4 h-4 text-violet-500" />} title={labels.brandingSection}>
      <div className="space-y-4">
        <div>
          <label htmlFor="company-invoice-prefix" className={FORM_LABEL_CLS}>{labels.invoicePrefix}</label>
          <input id="company-invoice-prefix" type="text" value={form.invoicePrefix} onChange={(e) => onChange('invoicePrefix', e.target.value)} className={FORM_INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="company-letterhead" className={FORM_LABEL_CLS}>{labels.letterheadFooter}</label>
          <textarea id="company-letterhead" value={form.letterheadFooter} onChange={(e) => onChange('letterheadFooter', e.target.value)} className={FORM_TEXTAREA_CLS} rows={2} />
        </div>
        <div>
          <label htmlFor="company-payment-terms" className={FORM_LABEL_CLS}>{labels.paymentTermsNote}</label>
          <textarea id="company-payment-terms" value={form.paymentTermsNote} onChange={(e) => onChange('paymentTermsNote', e.target.value)} className={FORM_TEXTAREA_CLS} rows={2} />
        </div>
      </div>
    </SectionCard>
  );
}

export function CompanySettingsForm({ section, form, onChange, labels }: CompanySettingsFormProps) {
  const showIdentity = section === 'all' || section === 'identity';
  const showBusiness = section === 'all' || section === 'business';
  const showTax = section === 'all' || section === 'tax';
  const showPreferences = section === 'all' || section === 'preferences';
  const showBranding = section === 'all';

  return (
    <div className={ST_FORM_STACK}>
      <div className={section === 'all' ? ST_FORM_GRID : ST_FORM_STACK}>
        {showIdentity ? <IdentityFields form={form} onChange={onChange} labels={labels} /> : null}
        {showBusiness ? <BusinessFields form={form} onChange={onChange} labels={labels} /> : null}
        {showTax ? <TaxFields form={form} onChange={onChange} labels={labels} /> : null}
        {showPreferences ? <PreferencesFields form={form} onChange={onChange} labels={labels} /> : null}
        {showBranding ? <BrandingFields form={form} onChange={onChange} labels={labels} /> : null}
      </div>
    </div>
  );
}
