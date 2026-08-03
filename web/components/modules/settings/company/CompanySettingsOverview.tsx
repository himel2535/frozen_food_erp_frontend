'use client';

import { Building2, Globe, Receipt, Settings } from 'lucide-react';
import { CompanySettingsHeader } from '@/components/modules/settings/company/CompanySettingsHeader';
import {
  CompanyDocumentsCard,
  CompanyInfoRow,
  CompanyOverviewCard,
  CompanyStatusPill,
} from '@/components/modules/settings/company/CompanyDocumentsCard';
import type { CompanyEditSection } from '@/components/modules/settings/company/company-form-utils';
import {
  formatCompanyAddress,
  formatCompanyTimezone,
  type CompanyDocument,
} from '@/lib/services/settings-service';
import type { CompanyProfile } from '@/lib/state/types';
import { ST_GRID, ST_STACK } from '@/components/modules/settings/settings-styles';

type CompanySettingsOverviewProps = {
  profile: CompanyProfile;
  documents: CompanyDocument[];
  labels: Record<string, string>;
  onEditAll: () => void;
  onEditSection: (section: CompanyEditSection) => void;
};

export function CompanySettingsOverview({
  profile,
  documents,
  labels,
  onEditAll,
  onEditSection,
}: CompanySettingsOverviewProps) {
  const address = formatCompanyAddress(profile);

  return (
    <div className={ST_STACK}>
      <CompanySettingsHeader profile={profile} editLabel={labels.editAll} onEdit={onEditAll} />

      <div className={ST_GRID}>
        <CompanyOverviewCard
          icon={<Building2 className="w-4 h-4 text-violet-500" />}
          title={labels.identitySection}
          editLabel={labels.editIdentity}
          onEdit={() => onEditSection('identity')}
        >
          <CompanyInfoRow label={labels.displayName} value={profile.name} />
          <CompanyInfoRow label={labels.legalName} value={profile.legalName ?? ''} />
          <CompanyInfoRow label={labels.industry} value={profile.industry ?? ''} />
          <CompanyInfoRow label={labels.registrationNo} value={profile.registrationNo ?? ''} />
          <CompanyInfoRow label={labels.establishedYear} value={profile.establishedYear ?? ''} />
          <CompanyInfoRow label={labels.email} value={profile.email ?? ''} />
          <CompanyInfoRow label={labels.phone} value={profile.phone ?? ''} />
          <CompanyInfoRow label={labels.companyAddress} value={address} />
        </CompanyOverviewCard>

        <CompanyOverviewCard
          icon={<Globe className="w-4 h-4 text-blue-500" />}
          title={labels.businessSection}
          editLabel={labels.editBusiness}
          onEdit={() => onEditSection('business')}
        >
          <CompanyInfoRow label={labels.currency} value={profile.currency ?? ''} />
          <CompanyInfoRow label={labels.timezone} value={formatCompanyTimezone(profile.timezone)} />
          <CompanyInfoRow label={labels.fiscalYearStart} value={profile.fiscalYearStart ?? ''} />
          <CompanyInfoRow label={labels.dateFormat} value={profile.dateFormat ?? ''} />
          <CompanyInfoRow label={labels.currencySymbol} value={profile.currencySymbol ?? ''} />
          <CompanyInfoRow label={labels.numberFormat} value={profile.numberFormat ?? ''} />
          <CompanyInfoRow label={labels.language} value={profile.language ?? ''} />
          <CompanyInfoRow label={labels.itemsPerPage} value={String(profile.itemsPerPage ?? '')} />
          <CompanyInfoRow label={labels.theme} value={profile.theme ?? ''} />
          <CompanyInfoRow label={labels.defaultLandingPage} value={profile.defaultLandingPage ?? ''} />
        </CompanyOverviewCard>

        <CompanyOverviewCard
          icon={<Receipt className="w-4 h-4 text-emerald-500" />}
          title={labels.taxSection}
          editLabel={labels.editTax}
          onEdit={() => onEditSection('tax')}
        >
          <CompanyInfoRow label={labels.taxId} value={profile.taxId ?? ''} />
          <CompanyInfoRow label={labels.vatNumber} value={profile.vatNumber ?? ''} />
        </CompanyOverviewCard>

        <CompanyOverviewCard
          icon={<Settings className="w-4 h-4 text-amber-500" />}
          title={labels.preferencesSection}
          editLabel={labels.editPreferences}
          onEdit={() => onEditSection('preferences')}
        >
          <CompanyInfoRow label={labels.defaultLandingPage} value={profile.defaultLandingPage ?? ''} />
          <CompanyInfoRow label={labels.notificationEmail} value={profile.notificationEmail ?? ''} />
          <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 border-b border-slate-50 items-center">
            <span className="text-xs font-bold text-slate-500">{labels.autoBackup}</span>
            <CompanyStatusPill
              label={profile.autoBackupEnabled ? labels.enabled : labels.disabled}
              enabled={profile.autoBackupEnabled ?? false}
            />
          </div>
          <CompanyInfoRow
            label={labels.sessionTimeout}
            value={profile.sessionTimeoutMinutes ? `${profile.sessionTimeoutMinutes} ${labels.minutes}` : ''}
          />
          <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 items-center">
            <span className="text-xs font-bold text-slate-500">{labels.twoFactor}</span>
            <CompanyStatusPill
              label={profile.twoFactorEnabled ? labels.enabled : labels.disabled}
              enabled={profile.twoFactorEnabled ?? false}
            />
          </div>
        </CompanyOverviewCard>
      </div>

      <CompanyDocumentsCard
        documents={documents}
        labels={{
          title: labels.documentsTitle,
          subtitle: labels.documentsSubtitle,
          upload: labels.uploadDocument,
          uploaded: labels.documentUploaded,
        }}
      />
    </div>
  );
}
