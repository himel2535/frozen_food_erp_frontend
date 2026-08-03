import type { CompanyProfile } from '@/lib/state/types';
import type { CompanyFormState } from '@/components/modules/settings/company/CompanySettingsForm';

export function companyToForm(profile: CompanyProfile): CompanyFormState {
  return {
    name: profile.name ?? '',
    legalName: profile.legalName ?? '',
    industry: profile.industry ?? '',
    registrationNo: profile.registrationNo ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    website: profile.website ?? '',
    currency: profile.currency ?? 'BDT',
    timezone: profile.timezone ?? 'Asia/Dhaka',
    fiscalYearStart: profile.fiscalYearStart ?? 'July',
    taxId: profile.taxId ?? '',
    vatNumber: profile.vatNumber ?? '',
    street: profile.street ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    postalCode: profile.postalCode ?? '',
    country: profile.country ?? '',
    invoicePrefix: profile.invoicePrefix ?? '',
    letterheadFooter: profile.letterheadFooter ?? '',
    paymentTermsNote: profile.paymentTermsNote ?? '',
    establishedYear: profile.establishedYear ?? '',
    dateFormat: profile.dateFormat ?? 'DD/MM/YYYY',
    currencySymbol: profile.currencySymbol ?? '৳',
    numberFormat: profile.numberFormat ?? '1,234,567.89',
    language: profile.language ?? 'English',
    itemsPerPage: String(profile.itemsPerPage ?? 20),
    theme: profile.theme ?? 'Light',
    defaultLandingPage: profile.defaultLandingPage ?? 'Dashboard',
    notificationEmail: profile.notificationEmail ?? profile.email ?? '',
    autoBackupEnabled: profile.autoBackupEnabled ?? true,
    sessionTimeoutMinutes: String(profile.sessionTimeoutMinutes ?? 30),
    twoFactorEnabled: profile.twoFactorEnabled ?? true,
  };
}

export function formToCompanyPayload(form: CompanyFormState): Partial<CompanyProfile> {
  return {
    name: form.name.trim(),
    legalName: form.legalName.trim(),
    industry: form.industry.trim(),
    registrationNo: form.registrationNo.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    website: form.website.trim(),
    currency: form.currency,
    timezone: form.timezone,
    fiscalYearStart: form.fiscalYearStart,
    taxId: form.taxId.trim(),
    vatNumber: form.vatNumber.trim(),
    street: form.street.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim(),
    country: form.country.trim(),
    invoicePrefix: form.invoicePrefix.trim(),
    letterheadFooter: form.letterheadFooter.trim(),
    paymentTermsNote: form.paymentTermsNote.trim(),
    establishedYear: form.establishedYear.trim(),
    dateFormat: form.dateFormat,
    currencySymbol: form.currencySymbol.trim(),
    numberFormat: form.numberFormat.trim(),
    language: form.language.trim(),
    itemsPerPage: Number(form.itemsPerPage) || 20,
    theme: form.theme.trim(),
    defaultLandingPage: form.defaultLandingPage.trim(),
    notificationEmail: form.notificationEmail.trim(),
    autoBackupEnabled: form.autoBackupEnabled,
    sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes) || 30,
    twoFactorEnabled: form.twoFactorEnabled,
  };
}

export type CompanyEditSection = 'all' | 'identity' | 'business' | 'tax' | 'preferences';

export function sectionPayload(section: CompanyEditSection, form: CompanyFormState): Partial<CompanyProfile> {
  const full = formToCompanyPayload(form);
  if (section === 'all') return full;
  if (section === 'identity') {
    return {
      name: full.name,
      legalName: full.legalName,
      industry: full.industry,
      registrationNo: full.registrationNo,
      establishedYear: full.establishedYear,
      phone: full.phone,
      email: full.email,
      website: full.website,
      street: full.street,
      city: full.city,
      state: full.state,
      postalCode: full.postalCode,
      country: full.country,
    };
  }
  if (section === 'business') {
    return {
      currency: full.currency,
      timezone: full.timezone,
      fiscalYearStart: full.fiscalYearStart,
      dateFormat: full.dateFormat,
      currencySymbol: full.currencySymbol,
      numberFormat: full.numberFormat,
      language: full.language,
      itemsPerPage: full.itemsPerPage,
      theme: full.theme,
      defaultLandingPage: full.defaultLandingPage,
    };
  }
  if (section === 'tax') {
    return { taxId: full.taxId, vatNumber: full.vatNumber };
  }
  return {
    defaultLandingPage: full.defaultLandingPage,
    notificationEmail: full.notificationEmail,
    autoBackupEnabled: full.autoBackupEnabled,
    sessionTimeoutMinutes: full.sessionTimeoutMinutes,
    twoFactorEnabled: full.twoFactorEnabled,
  };
}
