'use client';

import { Mail, Shield, User } from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { Footer } from '@/components/layout/Footer';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import {
  CF_BTN_GHOST,
  CF_BTN_PRIMARY,
  CF_FOOTER_CLS,
  CF_INPUT_CLS,
  CF_LABEL_CLS,
  CF_SELECT_CLS,
  CF_SUB_PANEL_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import { RoleSectionAccessGrid } from '@/components/modules/settings/roles/RoleSectionAccessGrid';
import { summarizeRoleSections } from '@/lib/services/access-control-service';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import type { RoleRecord, SectionId } from '@/lib/state/types';

const CF_INPUT_PLAIN = CF_INPUT_CLS.replace('pl-10', 'pl-4');

export type UserFormState = {
  uid?: string;
  name: string;
  email: string;
  password: string;
  status: 'active' | 'disabled';
  isMainAdmin: boolean;
  roleId: string;
  customizeAccess: boolean;
  allowedSections: SectionId[];
};

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function UserFormView({
  form,
  setForm,
  roles,
  sectionTotal,
  isEdit,
  saving,
  showAdvanced,
  setShowAdvanced,
  sectionsLocked,
  displaySections,
  onBack,
  onSubmit,
  onRoleChange,
  onToggleSection,
  onSelectAllSections,
  onClearAllSections,
  onToggleCustomizeAccess,
  t,
}: {
  form: UserFormState;
  setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
  roles: RoleRecord[];
  sectionTotal: number;
  isEdit: boolean;
  saving: boolean;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  sectionsLocked: boolean;
  displaySections: SectionId[];
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onRoleChange: (roleId: string) => void;
  onToggleSection: (id: SectionId) => void;
  onSelectAllSections: () => void;
  onClearAllSections: () => void;
  onToggleCustomizeAccess: () => void;
  t: TranslateFn;
}) {
  const sectionCount = displaySections.length;
  const progressPct = sectionTotal > 0 ? Math.round((sectionCount / sectionTotal) * 100) : 0;
  const accessDisabled = form.isMainAdmin || sectionsLocked;

  return (
    <div className={MODULE_LIST_SHELL}>
      <form onSubmit={onSubmit} className="w-full flex flex-col pb-4">
        <div className="pt-3 md:pt-4 mb-3">
          <FormHeader
            compact
            title={isEdit ? t('settings.users_edit_title') : t('settings.users_create_title')}
            subtitle={
              isEdit ? t('settings.users_edit_subtitle') : t('settings.users_create_subtitle')
            }
            onBack={onBack}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <FormSectionCard
              number={1}
              title={t('settings.users_section_account_title')}
              subtitle={t('settings.users_section_account_subtitle')}
            >
              <div>
                <label className={CF_LABEL_CLS}>{t('settings.users_name_label')} *</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={CF_INPUT_CLS}
                  />
                </div>
              </div>
              <div>
                <label className={CF_LABEL_CLS}>{t('settings.users_email_label')} *</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required={!isEdit}
                    disabled={isEdit}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className={`${CF_INPUT_CLS} disabled:bg-slate-50 disabled:text-slate-500`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={CF_LABEL_CLS}>
                    {isEdit ? t('settings.users_password_optional') : `${t('settings.users_password_label')} *`}
                  </label>
                  <input
                    type="password"
                    required={!isEdit}
                    minLength={isEdit ? undefined : 6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className={CF_INPUT_PLAIN}
                  />
                </div>
                <div>
                  <label className={CF_LABEL_CLS}>{t('settings.users_status_label')}</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as 'active' | 'disabled' }))
                    }
                    className={CF_SELECT_CLS}
                  >
                    <option value="active">{t('settings.users_status_active')}</option>
                    <option value="disabled">{t('settings.users_status_disabled')}</option>
                  </select>
                </div>
              </div>
            </FormSectionCard>

            <FormSectionCard
              number={2}
              title={t('settings.users_section_role_title')}
              subtitle={t('settings.users_section_role_subtitle')}
            >
              <div>
                <label className={CF_LABEL_CLS}>{t('settings.users_role_template_label')}</label>
                <select
                  value={form.roleId}
                  disabled={form.isMainAdmin}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className={`${CF_SELECT_CLS} disabled:bg-slate-50 disabled:text-slate-500`}
                >
                  <option value="">{t('settings.users_role_custom')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {form.roleId && !form.isMainAdmin ? (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-blue-600 mt-1.5 cursor-pointer hover:text-blue-800"
                    onClick={onToggleCustomizeAccess}
                  >
                    {form.customizeAccess
                      ? t('settings.users_lock_role_template')
                      : t('settings.users_customize_access')}
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer pt-1"
              >
                {showAdvanced ? t('common.hide_advanced') : t('common.show_advanced')}
              </button>

              {showAdvanced ? (
                <div className={`${CF_SUB_PANEL_CLS} space-y-3`}>
                  <label className="flex items-start gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isMainAdmin}
                      onChange={(e) => setForm((f) => ({ ...f, isMainAdmin: e.target.checked }))}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        {t('settings.users_main_admin_label')}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1 font-normal">
                        {t('settings.users_main_admin_hint')}
                      </span>
                    </span>
                  </label>
                </div>
              ) : null}
            </FormSectionCard>
          </div>

          <div className="lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
            <FormSectionCard
              number={3}
              title={t('settings.users_section_access_title')}
              subtitle={t('settings.users_section_access_subtitle')}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-full">
                  {t('settings.roles_sections_count', {
                    count: String(sectionCount),
                    total: String(sectionTotal),
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={accessDisabled}
                    className="text-[11px] font-semibold text-blue-600 cursor-pointer hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onSelectAllSections}
                  >
                    {t('settings.roles_select_all')}
                  </button>
                  <button
                    type="button"
                    disabled={accessDisabled}
                    className="text-[11px] font-semibold text-slate-500 cursor-pointer hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onClearAllSections}
                  >
                    {t('settings.roles_clear_all')}
                  </button>
                </div>
              </div>

              <div className="h-1.5 rounded-full bg-white/50 border border-white/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <RoleSectionAccessGrid
                selected={displaySections}
                onToggle={onToggleSection}
                disabled={accessDisabled}
              />

              {sectionsLocked ? (
                <p className="text-[11px] text-slate-500">{t('settings.users_sections_locked_hint')}</p>
              ) : null}
              {form.isMainAdmin ? (
                <p className="text-[11px] text-slate-500">{t('settings.users_main_admin_sections_hint')}</p>
              ) : null}

              <div className={`${CF_SUB_PANEL_CLS} px-3 py-2.5`}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                  {t('settings.roles_access_preview')}
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {form.isMainAdmin
                    ? t('settings.users_access_all_sections')
                    : summarizeRoleSections(displaySections)}
                </p>
              </div>
            </FormSectionCard>
          </div>
        </div>

        <div className={`${CF_FOOTER_CLS} !mt-3`}>
          <p className="text-xs font-semibold text-slate-500">
            {t('settings.users_footer_summary', {
              count: String(sectionCount),
              total: String(sectionTotal),
            })}
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className={CF_BTN_GHOST}>
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className={CF_BTN_PRIMARY}>
              {saving
                ? t('common.saving')
                : isEdit
                  ? t('settings.users_update_btn')
                  : t('settings.users_create_btn')}
            </button>
          </div>
        </div>
      </form>
      <Footer />
    </div>
  );
}
