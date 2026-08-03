'use client';

import {
  Activity,
  Briefcase,
  Calendar,
  Globe,
  Mail,
  Phone,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { Icon } from '@iconify/react';
import {
  ST_BODY,
  ST_CARD_COMPACT,
  ST_GRID,
  ST_LABEL,
  ST_SECTION_HEADER_COMPACT,
  ST_STACK,
  ST_TITLE,
} from '@/components/modules/settings/settings-styles';
import { ProfileSettingsHeader } from '@/components/modules/settings/profile/ProfileSettingsHeader';
import { ProfileSettingsMetrics } from '@/components/modules/settings/profile/ProfileSettingsMetrics';
import type {
  ProfileActivitySummary,
  ProfileMetrics,
  ProfileView,
} from '@/lib/services/settings-service';
import type { Lang } from '@/lib/state/types';

type ProfileSettingsOverviewProps = {
  profile: ProfileView;
  metrics: ProfileMetrics;
  activity: ProfileActivitySummary;
  lang: Lang;
  labels: Record<string, string>;
  onEdit: () => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className={ST_LABEL}>{label}</span>
      <span className={ST_BODY}>{value || '—'}</span>
    </div>
  );
}

function IconInfoRow({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <span className={`${ST_LABEL} block`}>{label}</span>
        <span className={`${ST_BODY} block truncate`}>{value || '—'}</span>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  className = '',
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${ST_CARD_COMPACT} ${className}`}>
      <div className={ST_SECTION_HEADER_COMPACT}>
        {icon}
        <h3 className={ST_TITLE}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatusPill({ label, tone = 'emerald' }: { label: string; tone?: 'emerald' | 'slate' }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-slate-50 text-slate-600 border-slate-100';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

function ActivityRow({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
      <span className={ST_LABEL}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`${ST_BODY} font-extrabold`}>{value}</span>
        {trend ? (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{trend}</span>
        ) : null}
      </div>
    </div>
  );
}

function languageLabel(lang: Lang) {
  return lang === 'bn' ? 'বাংলা' : 'English';
}

export function ProfileSettingsOverview({
  profile,
  metrics,
  activity,
  lang,
  labels,
  onEdit,
}: ProfileSettingsOverviewProps) {
  return (
    <div className={ST_STACK}>
      <ProfileSettingsHeader
        profile={profile}
        subtitle={labels.subtitle}
        editLabel={labels.edit}
        onEdit={onEdit}
      />

      <ProfileSettingsMetrics
        metrics={metrics}
        labels={{
          role: labels.kpiRole,
          branch: labels.kpiBranch,
          employeeId: labels.kpiEmployeeId,
          lastActive: labels.kpiLastActive,
          online: labels.online,
        }}
      />

      <div className={ST_GRID}>
        <SectionCard icon={<User className="w-4 h-4 text-blue-500" />} title={labels.personalSection}>
          <IconInfoRow
            icon={<User className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-50"
            label={labels.fullName}
            value={profile.name}
          />
          <IconInfoRow
            icon={<Mail className="w-4 h-4 text-violet-600" />}
            iconBg="bg-violet-50"
            label={labels.emailAddress}
            value={profile.email ?? ''}
          />
          <IconInfoRow
            icon={<Phone className="w-4 h-4 text-emerald-600" />}
            iconBg="bg-emerald-50"
            label={labels.phoneNumber}
            value={profile.phone ?? ''}
          />
        </SectionCard>

        <SectionCard icon={<Briefcase className="w-4 h-4 text-violet-500" />} title={labels.workSection}>
          <InfoRow label={labels.role} value={profile.roleLabel} />
          <InfoRow label={labels.department} value={profile.department ?? '—'} />
          <InfoRow label={labels.designation} value={profile.designation ?? '—'} />
          <InfoRow label={labels.branch} value={profile.branch ?? '—'} />
          <InfoRow label={labels.territory} value={profile.territory ?? '—'} />
          <InfoRow label={labels.employeeId} value={profile.employeeId ?? '—'} />
          <InfoRow label={labels.memberSince} value={profile.joiningDate ?? '—'} />
          <InfoRow label={labels.manager} value={profile.manager ?? '—'} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <SectionCard icon={<Settings className="w-4 h-4 text-cyan-500" />} title={labels.preferencesSection}>
          <IconInfoRow
            icon={<Globe className="w-4 h-4 text-cyan-600" />}
            iconBg="bg-cyan-50"
            label={labels.language}
            value={languageLabel(lang)}
          />
          <IconInfoRow
            icon={<Icon icon="fluent-color:clock-24" width={18} height={18} />}
            iconBg="bg-slate-100"
            label={labels.timezone}
            value={profile.timezone ?? '—'}
          />
          <IconInfoRow
            icon={<Calendar className="w-4 h-4 text-slate-600" />}
            iconBg="bg-slate-100"
            label={labels.dateFormat}
            value={profile.dateFormat ?? '—'}
          />
        </SectionCard>

        <SectionCard icon={<Shield className="w-4 h-4 text-violet-500" />} title={labels.securitySection}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 py-1">
              <span className={ST_LABEL}>{labels.passwordStatus}</span>
              <StatusPill label={labels.passwordStatusValue} />
            </div>
            <div className="py-1 border-t border-slate-50">
              <span className={`${ST_LABEL} block mb-1`}>{labels.sessionStatus}</span>
              <span className={`${ST_BODY} block`}>{activity.sessionLabel}</span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">{activity.sessionDetail}</span>
            </div>
            <div className="flex items-center justify-between gap-2 py-1 border-t border-slate-50">
              <span className={ST_LABEL}>{labels.twoFactor}</span>
              <StatusPill
                label={activity.twoFactorEnabled ? labels.twoFactorEnabled : labels.twoFactorDisabled}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Activity className="w-4 h-4 text-indigo-500" />} title={labels.activitySection}>
          <ActivityRow
            label={labels.logins30d}
            value={String(activity.logins30Days)}
            trend={activity.loginTrend}
          />
          <ActivityRow
            label={labels.profileUpdates}
            value={String(activity.profileUpdates)}
            trend={activity.updateTrend}
          />
          <ActivityRow
            label={labels.lastPasswordChange}
            value={`${activity.lastPasswordChangeDays} ${labels.daysAgo}`}
          />
        </SectionCard>
      </div>
    </div>
  );
}
