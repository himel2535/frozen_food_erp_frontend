import type { AppState, CompanyProfile, CompanySignature, CurrentUserProfile } from '@/lib/state/types';
import { DEFAULT_ALERT_SETTINGS } from '@/lib/services/alert-settings-defaults';
import { logSystemAudit } from '@/lib/services/audit-log-service';
import { formatDate } from '@/lib/i18n/locale-format';

export const DEFAULT_CURRENT_USER: CurrentUserProfile = {
  id: 'USR-001',
  name: 'John Doe',
  email: 'admin@toysfactory.com',
  phone: '+880 1711-000001',
  role: 'admin',
  branch: 'Head Office',
  territory: 'Global',
  employeeId: 'EMP-001',
  timezone: 'Asia/Dhaka',
  dateFormat: 'DD/MM/YYYY',
  bio: 'System administrator overseeing Toys Factory ERP operations.',
  emergencyContact: 'Operations Desk',
  emergencyPhone: '+880 1711-000002',
  notifyEmail: true,
  notifyPush: true,
  memberSince: '2024-01-15',
  lastActive: '2026-07-28 16:00',
  twoFactorEnabled: true,
  profileUpdateCount: 3,
  lastPasswordChangeDays: 45,
  logins30Days: 28,
  sessionDetail: 'Chrome on Windows',
  imageUrl: '',
};

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'Toys Factory ERP',
  legalName: 'Toys Factory Manufacturing Ltd.',
  industry: 'Toy Manufacturing',
  registrationNo: 'TRAD/DSCC/2020/10482',
  logoUrl: '/images/logo-toys.png',
  phone: '+880 2-55001234',
  email: 'info@toysfactory.com',
  website: 'www.toysfactory.com',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
  fiscalYearStart: 'July',
  taxId: 'TIN-123456789',
  vatNumber: 'VAT-987654321',
  street: '42 Industrial Area, Tejgaon',
  city: 'Dhaka',
  state: 'Dhaka Division',
  postalCode: '1208',
  country: 'Bangladesh',
  invoicePrefix: 'INV',
  letterheadFooter: 'Thank you for your business. Toys Factory Manufacturing Ltd.',
  paymentTermsNote: 'Net 30 days from invoice date unless otherwise agreed.',
  establishedYear: '2018',
  dateFormat: 'DD/MM/YYYY',
  currencySymbol: '৳',
  numberFormat: '1,234,567.89',
  language: 'English',
  itemsPerPage: 20,
  theme: 'Light',
  defaultLandingPage: 'Dashboard',
  notificationEmail: 'info@toysfactory.com',
  autoBackupEnabled: true,
  sessionTimeoutMinutes: 30,
  twoFactorEnabled: true,
  documents: [
    { id: 'DOC-001', name: 'Trade License', type: 'pdf' },
    { id: 'DOC-002', name: 'TIN Certificate', type: 'pdf' },
    { id: 'DOC-003', name: 'VAT Certificate', type: 'pdf' },
    { id: 'DOC-004', name: 'DSCC Certificate', type: 'pdf' },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureCurrentUser(state: AppState): CurrentUserProfile {
  if (!state.currentUser) {
    state.currentUser = clone(DEFAULT_CURRENT_USER);
  }
  return state.currentUser;
}

function ensureCompanyProfile(state: AppState): CompanyProfile {
  if (!state.companyProfile) {
    state.companyProfile = clone(DEFAULT_COMPANY_PROFILE);
  }
  return state.companyProfile;
}

function ensureCompanySignatures(state: AppState): CompanySignature[] {
  if (!state.companySignatures) {
    state.companySignatures = [];
  }
  return state.companySignatures;
}

function newSignatureId() {
  return `SIG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function stampNow() {
  return new Date().toISOString();
}

function findEmployee(state: AppState, employeeId: string) {
  return (state.employees ?? []).find((row) => String(row.id) === employeeId) ?? null;
}

function formatRoleLabel(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === 'admin') return 'Administrator';
  if (normalized === 'manager') return 'Manager';
  if (normalized === 'viewer') return 'Viewer';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatLastActive(value?: string) {
  if (!value) return 'Just now';
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return value;
  const diffMs = Date.now() - parsed.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(parsed, 'en', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isProfileOnline(lastActive?: string) {
  if (!lastActive) return true;
  const parsed = new Date(lastActive.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return true;
  return Date.now() - parsed.getTime() < 15 * 60 * 1000;
}

export type ProfileView = CurrentUserProfile & {
  roleLabel: string;
  designation?: string;
  department?: string;
  manager?: string;
  joiningDate?: string;
};

export type ProfileMetrics = {
  role: string;
  branch: string;
  employeeId: string;
  lastActive: string;
  isOnline: boolean;
};

export type ProfileActivitySummary = {
  logins30Days: number;
  loginTrend: string;
  profileUpdates: number;
  updateTrend: string;
  lastPasswordChangeDays: number;
  twoFactorEnabled: boolean;
  sessionLabel: string;
  sessionDetail: string;
};

export type CompanyMetrics = {
  employeeCount: number;
  warehouseCount: number;
  currency: string;
  fiscalYear: string;
};

export function getProfileView(state: AppState): ProfileView {
  const user = clone(ensureCurrentUser(state));
  const employee = user.employeeId ? findEmployee(state, user.employeeId) : null;

  return {
    ...user,
    roleLabel: formatRoleLabel(user.role),
    designation: employee ? String(employee.designation ?? '') : undefined,
    department: employee ? String(employee.department ?? '') : undefined,
    manager: employee ? String(employee.manager ?? '') : undefined,
    joiningDate: employee ? String(employee.joiningDate ?? user.memberSince ?? '') : user.memberSince,
    phone: user.phone || (employee ? String(employee.phone ?? '') : ''),
    email: user.email || (employee ? String(employee.email ?? '') : ''),
  };
}

export function getProfileMetrics(state: AppState): ProfileMetrics {
  const user = ensureCurrentUser(state);
  return {
    role: formatRoleLabel(user.role),
    branch: user.branch || '—',
    employeeId: user.employeeId || '—',
    lastActive: formatLastActive(user.lastActive),
    isOnline: isProfileOnline(user.lastActive),
  };
}

export function getProfileActivitySummary(state: AppState): ProfileActivitySummary {
  const user = ensureCurrentUser(state);
  const updates = user.profileUpdateCount ?? 3;
  const logins = user.logins30Days ?? 28;
  return {
    logins30Days: logins,
    loginTrend: '+12%',
    profileUpdates: updates,
    updateTrend: updates >= 3 ? '+50%' : '+0%',
    lastPasswordChangeDays: user.lastPasswordChangeDays ?? 45,
    twoFactorEnabled: user.twoFactorEnabled ?? true,
    sessionLabel: 'Active on this device',
    sessionDetail: user.sessionDetail ?? 'Chrome on Windows',
  };
}

export type CompanyDocument = {
  id: string;
  name: string;
  type: string;
};

export function formatCompanyAddress(profile: CompanyProfile) {
  const parts = [profile.street, profile.city, profile.state, profile.postalCode, profile.country].filter(Boolean);
  return parts.join(', ') || '—';
}

export function formatCompanyTimezone(timezone?: string) {
  if (!timezone) return '—';
  if (timezone === 'Asia/Dhaka') return 'Asia/Dhaka (GMT+6)';
  if (timezone === 'Asia/Kolkata') return 'Asia/Kolkata (GMT+5:30)';
  if (timezone === 'UTC') return 'UTC';
  if (timezone === 'America/New_York') return 'America/New_York (EST)';
  return timezone;
}

export function getCompanyDocuments(state: AppState): CompanyDocument[] {
  const profile = ensureCompanyProfile(state);
  return clone(profile.documents ?? DEFAULT_COMPANY_PROFILE.documents ?? []);
}

export function getCompanyProfile(state: AppState): CompanyProfile {
  return clone(ensureCompanyProfile(state));
}

export function getCompanyMetrics(state: AppState): CompanyMetrics {
  const profile = ensureCompanyProfile(state);
  const employees = state.employees ?? [];
  const warehouses = (state.inventoryWarehouses ?? []).filter(
    (row) => String(row.status ?? 'Active').toLowerCase() === 'active',
  );

  return {
    employeeCount: employees.length,
    warehouseCount: warehouses.length,
    currency: profile.currency || 'BDT',
    fiscalYear: profile.fiscalYearStart ? `Starts ${profile.fiscalYearStart}` : '—',
  };
}

export function updateProfile(state: AppState, payload: Partial<CurrentUserProfile>) {
  const user = ensureCurrentUser(state);
  const updateCount = (user.profileUpdateCount ?? 0) + 1;
  Object.assign(user, payload, {
    lastActive: new Date().toISOString().slice(0, 16).replace('T', ' '),
    profileUpdateCount: updateCount,
  });
  logSystemAudit(state, {
    action: 'UPDATE',
    module: 'Settings',
    entityType: 'profile',
    entityId: user.id,
    description: `Updated profile for ${user.name}`,
  });
  return { ok: true as const };
}

export function updateCompanyProfile(state: AppState, payload: Partial<CompanyProfile>) {
  const profile = ensureCompanyProfile(state);
  Object.assign(profile, payload);
  logSystemAudit(state, {
    action: 'UPDATE',
    module: 'Settings',
    entityType: 'company',
    entityId: profile.name,
    description: `Updated company settings for ${profile.name}`,
  });
  return { ok: true as const };
}

export type SignatureInput = {
  label: string;
  signerName: string;
  designation?: string;
  imageDataUrl: string;
  isDefault?: boolean;
};

export type SignaturePrintData = {
  imageDataUrl: string;
  signerName: string;
  designation?: string;
  label?: string;
};

export function getCompanySignatures(state: AppState): CompanySignature[] {
  return clone(ensureCompanySignatures(state));
}

export function getSignatureById(state: AppState, id: string): CompanySignature | null {
  const match = ensureCompanySignatures(state).find((row) => row.id === id);
  return match ? clone(match) : null;
}

export function getDefaultSignature(state: AppState): CompanySignature | null {
  const rows = ensureCompanySignatures(state);
  const match = rows.find((row) => row.isDefault) ?? rows[0] ?? null;
  return match ? clone(match) : null;
}

export function getSignatureMetrics(state: AppState) {
  const rows = ensureCompanySignatures(state);
  const defaultSignature = rows.find((row) => row.isDefault);
  return {
    total: rows.length,
    hasDefault: Boolean(defaultSignature),
    defaultName: defaultSignature?.signerName ?? '—',
  };
}

export function createCompanySignature(state: AppState, input: SignatureInput) {
  if (!input.imageDataUrl.trim()) {
    return { ok: false as const, error: 'Image is required.' };
  }
  if (!input.signerName.trim()) {
    return { ok: false as const, error: 'Signer name is required.' };
  }

  const rows = ensureCompanySignatures(state);
  const now = stampNow();
  const shouldDefault = input.isDefault || rows.length === 0;

  if (shouldDefault) {
    rows.forEach((row) => {
      row.isDefault = false;
    });
  }

  const record: CompanySignature = {
    id: newSignatureId(),
    label: input.label.trim() || 'Authorized Signatory',
    signerName: input.signerName.trim(),
    designation: input.designation?.trim() || undefined,
    imageDataUrl: input.imageDataUrl,
    isDefault: shouldDefault,
    createdAt: now,
    updatedAt: now,
  };

  rows.push(record);
  logSystemAudit(state, {
    action: 'CREATE',
    module: 'Settings',
    entityType: 'signature',
    entityId: record.id,
    description: `Added signature for ${record.signerName}`,
  });
  return { ok: true as const, id: record.id };
}

export function updateCompanySignature(state: AppState, id: string, input: SignatureInput) {
  const rows = ensureCompanySignatures(state);
  const idx = rows.findIndex((row) => row.id === id);
  if (idx < 0) return { ok: false as const, error: 'Signature not found.' };
  if (!input.signerName.trim()) {
    return { ok: false as const, error: 'Signer name is required.' };
  }
  if (!input.imageDataUrl.trim()) {
    return { ok: false as const, error: 'Image is required.' };
  }

  if (input.isDefault) {
    rows.forEach((row) => {
      row.isDefault = false;
    });
  }

  rows[idx] = {
    ...rows[idx],
    label: input.label.trim() || 'Authorized Signatory',
    signerName: input.signerName.trim(),
    designation: input.designation?.trim() || undefined,
    imageDataUrl: input.imageDataUrl,
    isDefault: input.isDefault ?? rows[idx].isDefault ?? false,
    updatedAt: stampNow(),
  };

  logSystemAudit(state, {
    action: 'UPDATE',
    module: 'Settings',
    entityType: 'signature',
    entityId: id,
    description: `Updated signature for ${rows[idx].signerName}`,
  });

  return { ok: true as const };
}

export function deleteCompanySignature(state: AppState, id: string) {
  const rows = ensureCompanySignatures(state);
  const idx = rows.findIndex((row) => row.id === id);
  if (idx < 0) return { ok: false as const, error: 'Signature not found.' };

  const removed = rows[idx];
  const wasDefault = rows[idx].isDefault;
  rows.splice(idx, 1);

  if (wasDefault && rows.length > 0) {
    rows[0].isDefault = true;
  }

  logSystemAudit(state, {
    action: 'DELETE',
    module: 'Settings',
    entityType: 'signature',
    entityId: id,
    description: `Deleted signature for ${removed.signerName}`,
  });

  return { ok: true as const };
}

export function setDefaultCompanySignature(state: AppState, id: string) {
  const rows = ensureCompanySignatures(state);
  const match = rows.find((row) => row.id === id);
  if (!match) return { ok: false as const, error: 'Signature not found.' };

  rows.forEach((row) => {
    row.isDefault = row.id === id;
    if (row.id === id) row.updatedAt = stampNow();
  });

  logSystemAudit(state, {
    action: 'UPDATE',
    module: 'Settings',
    entityType: 'signature',
    entityId: id,
    description: `Set default signature to ${match.signerName}`,
  });

  return { ok: true as const };
}

export function resolveInvoiceSignature(
  state: AppState,
  includeSignature?: boolean,
  signatureId?: string | null,
): SignaturePrintData | null {
  if (!includeSignature) return null;

  const signature = signatureId
    ? getSignatureById(state, signatureId)
    : getDefaultSignature(state);

  if (!signature) return null;

  return {
    imageDataUrl: signature.imageDataUrl,
    signerName: signature.signerName,
    designation: signature.designation,
    label: signature.label,
  };
}

export function ensureSettingsState(state: AppState) {
  ensureCurrentUser(state);
  ensureCompanyProfile(state);
  ensureCompanySignatures(state);
  if (!state.alertSettings) {
    state.alertSettings = JSON.parse(JSON.stringify(DEFAULT_ALERT_SETTINGS));
  }
}
