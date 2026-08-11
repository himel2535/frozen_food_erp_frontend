'use client';

import { Bell, Briefcase, Settings, User } from 'lucide-react';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import {
  ST_CARD_COMPACT,
  ST_FORM_GRID,
  ST_FORM_GRID_2,
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

export type ProfileFormState = {
  imageUrl: string;
  name: string;
  phone: string;
  email: string;
  branch: string;
  territory: string;
  timezone: string;
  dateFormat: string;
  lang: string;
  bio: string;
  emergencyContact: string;
  emergencyPhone: string;
  notifyEmail: boolean;
  notifyPush: boolean;
};

type ProfileSettingsFormProps = {
  form: ProfileFormState;
  roleLabel: string;
  employeeId: string;
  department?: string;
  designation?: string;
  manager?: string;
  joiningDate?: string;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onChange: (key: keyof ProfileFormState, value: string | boolean) => void;
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className={FORM_LABEL_CLS}>{label}</span>
      <div className="px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/80 text-xs font-semibold text-slate-700">
        {value || '—'}
      </div>
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

export function ProfileSettingsForm({
  form,
  roleLabel,
  employeeId,
  department,
  designation,
  manager,
  joiningDate,
  showAdvanced,
  onToggleAdvanced,
  onChange,
  labels,
}: ProfileSettingsFormProps) {
  return (
    <div className={ST_FORM_STACK}>
      <div className={ST_FORM_GRID}>
        <SectionCard icon={<User className="w-4 h-4 text-blue-500" />} title={labels.personalSection}>
          <div className={FORM_GRID_CLS}>
            <div className="md:col-span-2">
              <ImageUploadField
                label="Profile Photo"
                value={form.imageUrl}
                onChange={(url) => onChange('imageUrl', url)}
              />
            </div>
            <div>
              <label htmlFor="profile-name" className={FORM_LABEL_CLS}>{labels.fullName}</label>
              <input
                id="profile-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                className={FORM_INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className={FORM_LABEL_CLS}>{labels.phone}</label>
              <input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                className={FORM_INPUT_CLS}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="profile-email" className={FORM_LABEL_CLS}>{labels.email}</label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                className={FORM_INPUT_CLS}
                placeholder={labels.emailOptional}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Briefcase className="w-4 h-4 text-violet-500" />} title={labels.workSection}>
          <div className={FORM_GRID_CLS}>
            <ReadOnlyField label={labels.role} value={roleLabel} />
            <ReadOnlyField label={labels.employeeId} value={employeeId} />
            <ReadOnlyField label={labels.department} value={department ?? '—'} />
            <ReadOnlyField label={labels.designation} value={designation ?? '—'} />
            <div>
              <label htmlFor="profile-branch" className={FORM_LABEL_CLS}>{labels.branch}</label>
              <input
                id="profile-branch"
                type="text"
                value={form.branch}
                onChange={(e) => onChange('branch', e.target.value)}
                className={FORM_INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="profile-territory" className={FORM_LABEL_CLS}>{labels.territory}</label>
              <input
                id="profile-territory"
                type="text"
                value={form.territory}
                onChange={(e) => onChange('territory', e.target.value)}
                className={FORM_INPUT_CLS}
              />
            </div>
            <ReadOnlyField label={labels.manager} value={manager ?? '—'} />
            <ReadOnlyField label={labels.memberSince} value={joiningDate ?? '—'} />
          </div>
        </SectionCard>

        <SectionCard icon={<Settings className="w-4 h-4 text-cyan-500" />} title={labels.preferencesSection}>
          <div className={FORM_GRID_CLS}>
            <div>
              <label htmlFor="profile-lang" className={FORM_LABEL_CLS}>{labels.language}</label>
              <select
                id="profile-lang"
                value={form.lang}
                onChange={(e) => onChange('lang', e.target.value)}
                className={FORM_SELECT_CLS}
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
            <div>
              <label htmlFor="profile-timezone" className={FORM_LABEL_CLS}>{labels.timezone}</label>
              <select
                id="profile-timezone"
                value={form.timezone}
                onChange={(e) => onChange('timezone', e.target.value)}
                className={FORM_SELECT_CLS}
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            <div>
              <label htmlFor="profile-date-format" className={FORM_LABEL_CLS}>{labels.dateFormat}</label>
              <select
                id="profile-date-format"
                value={form.dateFormat}
                onChange={(e) => onChange('dateFormat', e.target.value)}
                className={FORM_SELECT_CLS}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Bell className="w-4 h-4 text-amber-500" />} title={labels.securitySection}>
          <div className="space-y-2">
            <ReadOnlyField label={labels.passwordStatus} value={labels.passwordStatusValue} />
            <ReadOnlyField label={labels.sessionStatus} value={labels.sessionStatusValue} />
            <p className="text-[11px] font-medium text-slate-500 pt-1">{labels.securityHint}</p>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-start">
        <AdvancedDetailsToggle open={showAdvanced} onToggle={onToggleAdvanced} />
      </div>

      {showAdvanced ? (
        <div className={ST_FORM_GRID_2}>
          <SectionCard icon={<User className="w-4 h-4 text-slate-500" />} title={labels.advancedSection}>
            <div className="space-y-4">
              <div>
                <label htmlFor="profile-bio" className={FORM_LABEL_CLS}>{labels.bio}</label>
                <textarea
                  id="profile-bio"
                  value={form.bio}
                  onChange={(e) => onChange('bio', e.target.value)}
                  className={FORM_TEXTAREA_CLS}
                  rows={3}
                />
              </div>
              <div className={FORM_GRID_CLS}>
                <div>
                  <label htmlFor="profile-emergency-contact" className={FORM_LABEL_CLS}>{labels.emergencyContact}</label>
                  <input
                    id="profile-emergency-contact"
                    type="text"
                    value={form.emergencyContact}
                    onChange={(e) => onChange('emergencyContact', e.target.value)}
                    className={FORM_INPUT_CLS}
                  />
                </div>
                <div>
                  <label htmlFor="profile-emergency-phone" className={FORM_LABEL_CLS}>{labels.emergencyPhone}</label>
                  <input
                    id="profile-emergency-phone"
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => onChange('emergencyPhone', e.target.value)}
                    className={FORM_INPUT_CLS}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Bell className="w-4 h-4 text-blue-500" />} title={labels.notificationsSection}>
            <div className="divide-y divide-slate-50">
              <ToggleField
                label={labels.notifyEmail}
                checked={form.notifyEmail}
                onChange={(value) => onChange('notifyEmail', value)}
              />
              <ToggleField
                label={labels.notifyPush}
                checked={form.notifyPush}
                onChange={(value) => onChange('notifyPush', value)}
              />
            </div>
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
