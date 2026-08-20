'use client';

import { Building2, Globe, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Icon } from '@iconify/react';
import {
  ST_ACCENT_BAR_COMPANY,
  ST_BODY,
  ST_CAPTION,
  ST_CARD,
} from '@/components/modules/settings/settings-styles';
import { formatCompanyAddress } from '@/lib/services/settings-service';
import { employeeInitials } from '@/lib/services/hrm-service';
import type { CompanyProfile } from '@/lib/state/types';

type CompanySettingsHeaderProps = {
  profile: CompanyProfile;
  editLabel?: string;
  onEdit?: () => void;
};

export function CompanySettingsHeader({ profile, editLabel, onEdit }: CompanySettingsHeaderProps) {
  const name = profile.name || 'Company';
  const address = formatCompanyAddress(profile);

  return (
    <div className={`relative overflow-hidden ${ST_CARD} bg-gradient-to-br from-cyan-50/40 via-white to-blue-50/30`}>
      <div className={ST_ACCENT_BAR_COMPANY} />
      <div className="flex flex-col xl:flex-row xl:items-stretch gap-3 pt-1">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-lg md:text-xl font-extrabold shrink-0 ring-4 ring-white shadow-md bg-rose-100 text-rose-700"
          >
            {employeeInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
              {profile.industry ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-100">
                  <Building2 className="w-3.5 h-3.5" />
                  {profile.industry}
                </span>
              ) : null}
            </div>
            {profile.legalName ? (
              <p className={`${ST_CAPTION} mt-1 font-semibold`}>{profile.legalName}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile.establishedYear ? (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  Est. {profile.establishedYear}
                </span>
              ) : null}
              {profile.registrationNo ? (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  {profile.registrationNo}
                </span>
              ) : null}
              {profile.currency ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                  {profile.currency}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
              {profile.email ? (
                <span className={`inline-flex items-center gap-1.5 ${ST_BODY}`}>
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </span>
              ) : null}
              {profile.website ? (
                <span className={`inline-flex items-center gap-1.5 ${ST_BODY}`}>
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile.website}</span>
                </span>
              ) : null}
              {profile.phone ? (
                <span className={`inline-flex items-center gap-1.5 ${ST_BODY}`}>
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile.phone}</span>
                </span>
              ) : null}
              {address !== '—' ? (
                <span className={`inline-flex items-start gap-1.5 ${ST_BODY}`}>
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{address}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-4 shrink-0">
          {onEdit ? (
          <Button
            type="button"
            onClick={onEdit}
            variant="primary"
            size="sm"
            leftIcon={<Pencil className="w-4 h-4" />}
          >
            {editLabel ?? 'Edit Company Settings'}
          </Button>
          ) : null}
          <div className="hidden lg:flex items-end justify-center w-44 xl:w-52">
            <Icon icon="fluent-color:building-factory-24" width={160} height={160} className="opacity-90" />
          </div>
        </div>
      </div>
    </div>
  );
}
