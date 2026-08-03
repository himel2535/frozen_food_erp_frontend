'use client';

import { toast } from '@/lib/ui/feedback';
import { useMemo, useState, type FormEvent } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { ProfileSettingsForm } from '@/components/modules/settings/profile/ProfileSettingsForm';
import { ProfileSettingsOverview } from '@/components/modules/settings/profile/ProfileSettingsOverview';
import { profileToForm } from '@/components/modules/settings/profile/profile-form-utils';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FORM_BTN_PRIMARY, FORM_BTN_SECONDARY } from '@/lib/ui/form-styles';
import { ST_FORM_FOOTER } from '@/components/modules/settings/settings-styles';
import {
  getProfileActivitySummary,
  getProfileMetrics,
  getProfileView,
  updateProfile,
} from '@/lib/services/settings-service';
import { useAppStore } from '@/lib/state/app-store';
import type { Lang } from '@/lib/state/types';
import type { ProfileFormState } from '@/components/modules/settings/profile/ProfileSettingsForm';

export function ProfileSettingsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const replaceAppState = useAppStore((s) => s.replaceAppState);
  const t = useAppStore((s) => s.t);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [, bump] = useState(0);
  const [form, setForm] = useState<ProfileFormState>(() =>
    profileToForm(getProfileView(appState), appState.lang ?? 'en'),
  );

  const profile = useMemo(() => getProfileView(appState), [appState, bump]);
  const metrics = useMemo(() => getProfileMetrics(appState), [appState, bump]);
  const activity = useMemo(() => getProfileActivitySummary(appState), [appState, bump]);

  const labels = useMemo(
    () => ({
      personalSection: t('settings.profile_personal'),
      workSection: t('settings.profile_work'),
      preferencesSection: t('settings.profile_preferences'),
      securitySection: t('settings.profile_security'),
      advancedSection: t('settings.profile_advanced'),
      notificationsSection: t('settings.profile_notifications'),
      activitySection: t('settings.profile_activity'),
      fullName: t('settings.profile_full_name'),
      emailAddress: t('settings.profile_email_address'),
      phoneNumber: t('settings.profile_phone_number'),
      phone: t('settings.profile_phone'),
      email: t('settings.profile_email'),
      emailOptional: t('settings.profile_email_optional'),
      role: t('settings.profile_role'),
      employeeId: t('settings.profile_employee_id'),
      department: t('settings.profile_department'),
      designation: t('settings.profile_designation'),
      branch: t('settings.profile_branch'),
      territory: t('settings.profile_territory'),
      manager: t('settings.profile_manager'),
      memberSince: t('settings.profile_member_since'),
      language: t('settings.profile_language'),
      timezone: t('settings.profile_timezone'),
      dateFormat: t('settings.profile_date_format'),
      passwordStatus: t('settings.profile_password_status'),
      passwordStatusValue: t('settings.profile_password_ok'),
      sessionStatus: t('settings.profile_session_status'),
      sessionStatusValue: t('settings.profile_session_active'),
      securityHint: t('settings.profile_security_hint'),
      bio: t('settings.profile_bio'),
      emergencyContact: t('settings.profile_emergency_contact'),
      emergencyPhone: t('settings.profile_emergency_phone'),
      notifyEmail: t('settings.profile_notify_email'),
      notifyPush: t('settings.profile_notify_push'),
      save: t('settings.save_changes'),
      cancel: t('settings.profile_cancel'),
      saved: t('settings.profile_saved'),
      subtitle: t('settings.profile_subtitle'),
      edit: t('settings.profile_edit'),
      editTitle: t('settings.profile_edit_title'),
      editSubtitle: t('settings.profile_edit_subtitle'),
      back: t('settings.profile_back'),
      kpiRole: t('settings.profile_kpi_role'),
      kpiBranch: t('settings.profile_kpi_branch'),
      kpiEmployeeId: t('settings.profile_kpi_employee_id'),
      kpiLastActive: t('settings.profile_kpi_last_active'),
      online: t('settings.profile_online'),
      twoFactor: t('settings.profile_two_factor'),
      twoFactorEnabled: t('settings.profile_two_factor_enabled'),
      twoFactorDisabled: t('settings.profile_two_factor_disabled'),
      logins30d: t('settings.profile_logins_30d'),
      profileUpdates: t('settings.profile_updates'),
      lastPasswordChange: t('settings.profile_last_password'),
      daysAgo: t('settings.profile_days_ago'),
    }),
    [t],
  );

  const openEdit = () => {
    setForm(profileToForm(getProfileView(appState), appState.lang ?? 'en'));
    setShowAdvanced(false);
    setView('form');
  };

  const closeForm = () => {
    setShowAdvanced(false);
    setView('main');
  };

  const onChange = (key: keyof ProfileFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Validation failed', { module: 'Profile', description: 'Name is required.' });
      return;
    }

    updateProfile(appState, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      branch: form.branch.trim(),
      territory: form.territory.trim(),
      timezone: form.timezone,
      dateFormat: form.dateFormat,
      bio: form.bio.trim(),
      emergencyContact: form.emergencyContact.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      notifyEmail: form.notifyEmail,
      notifyPush: form.notifyPush,
    });

    if (form.lang !== appState.lang) {
      replaceAppState({ lang: form.lang as Lang });
    } else {
      saveAppState();
    }

    bump((n) => n + 1);
    toast.success(labels.saved, { module: 'Profile' });
    closeForm();
  };

  if (view === 'form') {
    return (
      <div className={MODULE_LIST_SHELL}>
        <form onSubmit={handleSubmit} className="w-full flex flex-col min-h-full pb-4">
          <div className="pt-3 md:pt-4 mb-3">
            <FormHeader
              compact
              title={labels.editTitle}
              subtitle={labels.editSubtitle}
              onBack={closeForm}
              backLabel={labels.back}
            />
          </div>
          <ProfileSettingsForm
            form={form}
            roleLabel={profile.roleLabel}
            employeeId={profile.employeeId ?? '—'}
            department={profile.department}
            designation={profile.designation}
            manager={profile.manager}
            joiningDate={profile.joiningDate}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced((open) => !open)}
            onChange={onChange}
            labels={labels}
          />
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
      <ProfileSettingsOverview
        profile={profile}
        metrics={metrics}
        activity={activity}
        lang={appState.lang ?? 'en'}
        labels={labels}
        onEdit={openEdit}
      />
      <Footer />
    </div>
  );
}
