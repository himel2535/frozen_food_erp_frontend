export type Lang = 'en' | 'bn';

import type { AlertSettings } from '@/lib/services/business-alert-types';

export interface CurrentUserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  branch: string;
  territory?: string;
  employeeId?: string;
  timezone?: string;
  dateFormat?: string;
  bio?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notifyEmail?: boolean;
  notifyPush?: boolean;
  memberSince?: string;
  lastActive?: string;
  twoFactorEnabled?: boolean;
  profileUpdateCount?: number;
  lastPasswordChangeDays?: number;
  logins30Days?: number;
  sessionDetail?: string;
}

export interface CompanyProfile {
  name: string;
  legalName?: string;
  industry?: string;
  registrationNo?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency?: string;
  timezone?: string;
  fiscalYearStart?: string;
  taxId?: string;
  vatNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  invoicePrefix?: string;
  letterheadFooter?: string;
  paymentTermsNote?: string;
  establishedYear?: string;
  dateFormat?: string;
  currencySymbol?: string;
  numberFormat?: string;
  language?: string;
  itemsPerPage?: number;
  theme?: string;
  defaultLandingPage?: string;
  notificationEmail?: string;
  autoBackupEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  twoFactorEnabled?: boolean;
  documents?: Array<{ id: string; name: string; type: string }>;
}

export interface CompanySignature {
  id: string;
  label: string;
  signerName: string;
  designation?: string;
  imageDataUrl: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  isLoggedIn: boolean;
  sidebarCollapsed: boolean;
  lang?: Lang;
  crmFilter: string;
  invFilterCategory: string;
  hrmActiveTab: string;
  hrmDirectoryFilterStatus: string;
  hrmDirectoryFilterDept: string;
  hrmAttendanceDate: string;
  salesUi: Record<string, unknown>;
  invoiceApprovalsById: Record<string, unknown>;
  recurringInvoicesById: Record<string, unknown>;
  paymentAllocationsById: Record<string, unknown>;
  crmCustomers: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  inventoryCategories: Array<Record<string, unknown>>;
  inventoryUnits: Array<Record<string, unknown>>;
  inventoryWarehouses: Array<Record<string, unknown>>;
  invoices: Array<Record<string, unknown>>;
  employees: Array<Record<string, unknown>>;
  attendance: Array<Record<string, unknown>>;
  purchases: Array<Record<string, unknown>>;
  purchasesFilter?: string;
  accounting: Array<Record<string, unknown>>;
  cashboxEntries?: Array<Record<string, unknown>>;
  dueEntries?: Array<Record<string, unknown>>;
  purchasePayments?: Array<Record<string, unknown>>;
  trialBalance?: Array<Record<string, unknown>>;
  profitLoss?: Array<Record<string, unknown>>;
  balanceSheet?: Array<Record<string, unknown>>;
  salaryStructures?: Array<Record<string, unknown>>;
  salarySheetEntries?: Array<Record<string, unknown>>;
  payroll: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  manufacturing: Array<Record<string, unknown>>;
  productionOrders?: Array<Record<string, unknown>>;
  purchasesSuppliers?: Array<Record<string, unknown>>;
  purchaseRmOrders?: Array<Record<string, unknown>>;
  approvals?: Array<Record<string, unknown>>;
  salesOrders?: Array<Record<string, unknown>>;
  currentUser?: CurrentUserProfile;
  companyProfile?: CompanyProfile;
  companySignatures?: CompanySignature[];
  alertSettings?: AlertSettings;
  finishedGoodsRecipes?: Array<Record<string, unknown>>;
  semiFinishedRecipes?: Array<Record<string, unknown>>;
  crmUi?: Record<string, unknown>;
  crmData?: Record<string, unknown>;
  [key: string]: unknown;
}
