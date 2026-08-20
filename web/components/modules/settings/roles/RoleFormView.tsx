'use client';

import { Mail, UserPlus } from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import {
  CF_FOOTER_CLS,
  CF_INPUT_CLS,
  CF_LABEL_CLS,
  CF_SELECT_CLS,
  CF_SUB_PANEL_CLS,
  CF_TEXTAREA_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import { RoleNameInput } from '@/components/modules/settings/roles/RoleNameInput';
import { RolePresetChips } from '@/components/modules/settings/roles/RolePresetChips';
import { GranularPermissionsPanel } from '@/components/modules/settings/roles/GranularPermissionsPanel';
import { RoleSectionAccessGrid } from '@/components/modules/settings/roles/RoleSectionAccessGrid';
import type { GranularPermission } from '@/lib/config/granular-permissions';
import { summarizeRoleSections } from '@/lib/services/access-control-service';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import type { RoleRecord, SectionId } from '@/lib/state/types';

const CF_INPUT_PLAIN = CF_INPUT_CLS.replace('pl-10', 'pl-4');

export type RoleFormState = {
  id?: string;
  name: string;
  description: string;
  contactEmail: string;
  notes: string;
  status: 'active' | 'inactive';
  allowedSections: SectionId[];
  allowedPermissions: string[];
  provisionName: string;
  provisionEmail: string;
  provisionPassword: string;
};

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function RoleFormView({
  form,
  setForm,
  existingRoles,
  sectionTotal,
  isEdit,
  saving,
  showAdvanced,
  setShowAdvanced,
  onBack,
  onSubmit,
  onPresetSelect,
  onToggleSection,
  onSelectAllSections,
  onClearAllSections,
  onTogglePermission,
  t,
}: {
  form: RoleFormState;
  setForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
  existingRoles: RoleRecord[];
  sectionTotal: number;
  isEdit: boolean;
  saving: boolean;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onPresetSelect: (preset: {
    name: string;
    description: string;
    allowedSections: SectionId[];
  }) => void;
  onToggleSection: (id: SectionId) => void;
  onSelectAllSections: () => void;
  onClearAllSections: () => void;
  onTogglePermission: (permission: GranularPermission) => void;
  t: TranslateFn;
}) {
  const sectionCount = form.allowedSections.length;
  const progressPct = sectionTotal > 0 ? Math.round((sectionCount / sectionTotal) * 100) : 0;

  return (
    <div className={MODULE_LIST_SHELL}>
      <form onSubmit={onSubmit} className="w-full flex flex-col pb-4">
        <div className="pt-3 md:pt-4 mb-3">
          <FormHeader
            compact
            title={isEdit ? t('settings.roles_edit_title') : t('settings.roles_create_title')}
            subtitle={isEdit ? t('settings.roles_edit_subtitle') : t('settings.roles_create_subtitle')}
            onBack={onBack}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <FormSectionCard
              number={1}
              title={t('settings.roles_section_identity_title')}
              subtitle={t('settings.roles_section_identity_subtitle')}
            >
              <div>
                <label className={CF_LABEL_CLS}>{t('settings.roles_name_label')} *</label>
                <RoleNameInput
                  value={form.name}
                  existingRoles={existingRoles}
                  hint={t('settings.roles_name_hint')}
                  onChange={(name) => setForm((f) => ({ ...f, name }))}
                  onPresetSelect={onPresetSelect}
                />
              </div>
              <RolePresetChips
                activeName={form.name}
                presetsLabel={t('settings.roles_presets_label')}
                onSelect={onPresetSelect}
              />
              <div>
                <label className={CF_LABEL_CLS}>{t('settings.roles_description_label')}</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t('settings.roles_description_placeholder')}
                  className={`${CF_TEXTAREA_CLS} !pl-4`}
                />
              </div>
            </FormSectionCard>

            <FormSectionCard
              number={2}
              title={t('settings.roles_section_contact_title')}
              subtitle={t('settings.roles_section_contact_subtitle')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={CF_LABEL_CLS}>{t('settings.roles_contact_email_label')}</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                      placeholder={t('settings.roles_contact_email_placeholder')}
                      className={CF_INPUT_CLS}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">{t('settings.roles_contact_email_hint')}</p>
                </div>
                <div>
                  <label className={CF_LABEL_CLS}>{t('settings.roles_status_label')}</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))
                    }
                    className={CF_SELECT_CLS}
                  >
                    <option value="active">{t('settings.roles_status_active')}</option>
                    <option value="inactive">{t('settings.roles_status_inactive')}</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer pt-1"
              >
                {showAdvanced ? t('common.hide_advanced') : t('common.show_advanced')}
              </button>

              {showAdvanced ? (
                <div className={`${CF_SUB_PANEL_CLS} space-y-4`}>
                  <div>
                    <label className={CF_LABEL_CLS}>{t('settings.roles_notes_label')}</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className={`${CF_TEXTAREA_CLS} !pl-4`}
                    />
                  </div>

                  {!isEdit ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200/80">
                      <div className="flex items-start gap-2">
                        <UserPlus className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{t('settings.roles_provision_title')}</h4>
                          <p className="text-[11px] text-slate-500 mt-1">{t('settings.roles_provision_hint')}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={CF_LABEL_CLS}>{t('settings.roles_provision_name')}</label>
                          <input
                            type="text"
                            value={form.provisionName}
                            onChange={(e) => setForm((f) => ({ ...f, provisionName: e.target.value }))}
                            className={CF_INPUT_PLAIN}
                          />
                        </div>
                        <div>
                          <label className={CF_LABEL_CLS}>{t('settings.roles_provision_email')}</label>
                          <input
                            type="email"
                            value={form.provisionEmail}
                            onChange={(e) => setForm((f) => ({ ...f, provisionEmail: e.target.value }))}
                            className={CF_INPUT_PLAIN}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={CF_LABEL_CLS}>{t('settings.roles_provision_password')}</label>
                          <input
                            type="password"
                            minLength={6}
                            value={form.provisionPassword}
                            onChange={(e) => setForm((f) => ({ ...f, provisionPassword: e.target.value }))}
                            className={CF_INPUT_PLAIN}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </FormSectionCard>
          </div>

          <div className="lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
            <FormSectionCard
              number={3}
              title={t('settings.roles_section_access_title')}
              subtitle={t('settings.roles_section_access_subtitle')}
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
                    className="text-[11px] font-semibold text-blue-600 cursor-pointer hover:text-blue-800"
                    onClick={onSelectAllSections}
                  >
                    {t('settings.roles_select_all')}
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-slate-500 cursor-pointer hover:text-slate-800"
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

              <RoleSectionAccessGrid selected={form.allowedSections} onToggle={onToggleSection} />

              <GranularPermissionsPanel
                allowedSections={form.allowedSections}
                allowedPermissions={form.allowedPermissions}
                onTogglePermission={onTogglePermission}
              />

              <div className={`${CF_SUB_PANEL_CLS} px-3 py-2.5`}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                  {t('settings.roles_access_preview')}
                </p>
                <p className="text-xs font-medium text-slate-700">
                  {summarizeRoleSections(form.allowedSections)}
                </p>
              </div>
            </FormSectionCard>
          </div>
        </div>

        <div className={`${CF_FOOTER_CLS} !mt-3`}>
          <p className="text-xs font-semibold text-slate-500">
            {t('settings.roles_footer_summary', {
              count: String(sectionCount),
              total: String(sectionTotal),
            })}
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={onBack} variant="ghost">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving} variant="primary">
              {isEdit ? t('settings.roles_update_btn') : t('settings.roles_create_btn')}
            </Button>
          </div>
        </div>
      </form>
      <Footer />
    </div>
  );
}
