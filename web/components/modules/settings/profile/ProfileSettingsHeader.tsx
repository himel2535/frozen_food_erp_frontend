'use client';

import { Briefcase, Building2, Globe, Mail, Pencil, Phone, Shield } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ST_ACCENT_BAR,
  ST_BODY,
  ST_CAPTION,
  ST_CARD,
} from '@/components/modules/settings/settings-styles';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import { isProfileOnline, type ProfileView } from '@/lib/services/settings-service';

type ProfileSettingsHeaderProps = {
  profile: ProfileView;
  subtitle?: string;
  editLabel?: string;
  onEdit?: () => void;
};

export function ProfileSettingsHeader({ profile, subtitle, editLabel, onEdit }: ProfileSettingsHeaderProps) {
  const name = profile.name || 'User';
  const online = isProfileOnline(profile.lastActive);

  return (
    <div className={`relative overflow-hidden ${ST_CARD}`}>
      <div className={ST_ACCENT_BAR} />
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 pt-1">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-lg md:text-xl font-extrabold ring-4 ring-white shadow-md ${employeeAvatarClass(name)}`}
            >
              {employeeInitials(name)}
            </div>
            {online ? (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" title="Online" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <StatusBadge status={profile.roleLabel} />
              </span>
            </div>
            {subtitle ? <p className={`${ST_CAPTION} mt-1`}>{subtitle}</p> : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100">
                <Building2 className="w-3.5 h-3.5" />
                {profile.branch || '—'}
              </span>
              {profile.territory ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5" />
                  {profile.territory}
                </span>
              ) : null}
              {profile.designation ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  <Briefcase className="w-3.5 h-3.5" />
                  {profile.designation}
                </span>
              ) : null}
              {profile.employeeId ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                  {profile.employeeId}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              {profile.email ? (
                <span className={`inline-flex items-center gap-1.5 ${ST_BODY}`}>
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
              ) : null}
              {profile.phone ? (
                <span className={`inline-flex items-center gap-1.5 ${ST_BODY}`}>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {profile.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shrink-0 self-start"
          >
            <Pencil className="w-4 h-4" />
            {editLabel ?? 'Edit Profile'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
