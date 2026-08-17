'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FORM_BTN_PRIMARY, FORM_BTN_SECONDARY } from '@/lib/ui/form-styles';
import { ST_FORM_FOOTER } from '@/components/modules/settings/settings-styles';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { saveSettingsDoc } from '@/lib/services/settings-api-service';
import { toast } from '@/lib/ui/feedback';
import {
  ALL_ALERT_CATEGORIES,
  DEFAULT_ALERT_SETTINGS,
  getAlertSettings,
} from '@/lib/services/business-alert-service';
import { logSystemAudit } from '@/lib/services/audit-log-service';
import type { AlertCategory, AlertRole, AlertSettings } from '@/lib/services/business-alert-types';

const ROLE_LABEL_KEYS: Record<AlertRole, string> = {
  ceo_admin: 'alerts.role_ceo_admin',
  cfo: 'alerts.role_cfo',
  sales_manager: 'alerts.role_sales_manager',
  store_manager: 'alerts.role_store_manager',
  production_manager: 'alerts.role_production_manager',
};

const CATEGORY_LABEL_KEYS: Record<AlertCategory, string> = {
  customer_due: 'alerts.category_customer_due_short',
  lead_followup: 'alerts.category_lead_followup_short',
  low_stock: 'alerts.category_low_stock_short',
  pending_purchase: 'alerts.category_pending_purchase_short',
  production: 'alerts.category_production_short',
  payment_collection: 'alerts.category_payment_collection_short',
  supplier_due: 'alerts.category_supplier_due_short',
};

const ROLES: AlertRole[] = ['ceo_admin', 'cfo', 'sales_manager', 'store_manager', 'production_manager'];

function cloneSettings(settings: AlertSettings): AlertSettings {
  return JSON.parse(JSON.stringify(settings)) as AlertSettings;
}

export function AlertSettingsPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const t = useAppStore((s) => s.t);
  const [, bump] = useState(0);

  const [form, setForm] = useState<AlertSettings>(() => cloneSettings(getAlertSettings(appState)));
  const { isSubmitting, guardSubmit } = useSubmitGuard();

  useChromeSuppressed(true);

  const labels = useMemo(
    () => ({
      thresholds: t('alerts.settings_thresholds'),
      customerDueDays: t('alerts.settings_customer_due_days'),
      leadFollowUpDays: t('alerts.settings_lead_followup_days'),
      supplierDueDays: t('alerts.settings_supplier_due_days'),
      productionDelayDays: t('alerts.settings_production_delay_days'),
      lowStockReorder: t('alerts.settings_low_stock_reorder'),
      notificationSound: t('alerts.settings_notification_sound'),
      roleMatrix: t('alerts.settings_role_matrix'),
      save: t('common.save'),
      cancel: t('common.cancel'),
      saved: t('alerts.settings_saved'),
    }),
    [t],
  );

  const handleReset = () => {
    setForm(cloneSettings(DEFAULT_ALERT_SETTINGS));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    await guardSubmit(async () => {
      appState.alertSettings = cloneSettings(form);
      logSystemAudit(appState, {
        action: 'UPDATE',
        module: 'Settings',
        entityType: 'alertSettings',
        description: 'Updated alert thresholds and role visibility',
      });
      if (isModuleApiMode('companySettings')) {
        const result = await saveSettingsDoc('alertSettings', appState.alertSettings);
        if (!result.ok) {
          toast.error('Operation failed', { module: 'Alert Settings', description: 'error' in result ? String(result.error) : 'Save failed' });
          return;
        }
      } else {
        saveAppState();
      }
      bump((n) => n + 1);
      toast.success(labels.saved, { module: 'Alert Settings' });
    });
  };

  const toggleRoleCategory = (role: AlertRole, category: AlertCategory) => {
    setForm((prev) => {
      const next = cloneSettings(prev);
      const list = next.roleVisibility[role] ?? [];
      if (list.includes(category)) {
        next.roleVisibility[role] = list.filter((c) => c !== category);
      } else {
        next.roleVisibility[role] = [...list, category];
      }
      return next;
    });
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <FormHeader
        compact
        title={t('alerts.settings_title')}
        subtitle={t('alerts.settings_subtitle')}
        onBack={() => router.push('/dashboard')}
        backLabel={t('common.back')}
      />

      <form onSubmit={handleSubmit} className="space-y-2">
        <section className="premium-card premium-shadow p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Icon icon="fluent-color:clock-24" width={22} height={22} />
            <h3 className="text-sm font-bold text-slate-900">{labels.thresholds}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">{labels.customerDueDays}</span>
              <input
                type="number"
                min={1}
                value={form.customerDueReminderDays}
                onChange={(e) => setForm((p) => ({ ...p, customerDueReminderDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">{labels.leadFollowUpDays}</span>
              <input
                type="number"
                min={0}
                value={form.leadFollowUpReminderDays}
                onChange={(e) => setForm((p) => ({ ...p, leadFollowUpReminderDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">{labels.supplierDueDays}</span>
              <input
                type="number"
                min={1}
                value={form.supplierDueReminderDays}
                onChange={(e) => setForm((p) => ({ ...p, supplierDueReminderDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">{labels.productionDelayDays}</span>
              <input
                type="number"
                min={1}
                value={form.productionDelayDays}
                onChange={(e) => setForm((p) => ({ ...p, productionDelayDays: Number(e.target.value) }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.lowStockUseReorderLevel}
              onChange={(e) => setForm((p) => ({ ...p, lowStockUseReorderLevel: e.target.checked }))}
              className="rounded border-slate-300 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">{labels.lowStockReorder}</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer ml-0 sm:ml-6">
            <input
              type="checkbox"
              checked={form.notificationSound}
              onChange={(e) => setForm((p) => ({ ...p, notificationSound: e.target.checked }))}
              className="rounded border-slate-300 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">{labels.notificationSound}</span>
          </label>
        </section>

        <section className="premium-card premium-shadow p-4 overflow-x-auto">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
            <Icon icon="fluent-color:shield-24" width={22} height={22} />
            <h3 className="text-sm font-bold text-slate-900">{labels.roleMatrix}</h3>
          </div>
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <th className="pb-2 pr-3">{t('alerts.settings_role_col')}</th>
                {ALL_ALERT_CATEGORIES.map((cat) => (
                  <th key={cat} className="pb-2 px-2 text-center whitespace-nowrap">
                    {t(CATEGORY_LABEL_KEYS[cat])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role} className="border-t border-slate-100">
                  <td className="py-2.5 pr-3 font-bold text-slate-800 whitespace-nowrap">{t(ROLE_LABEL_KEYS[role])}</td>
                  {ALL_ALERT_CATEGORIES.map((cat) => {
                    const checked = (form.roleVisibility[role] ?? []).includes(cat);
                    return (
                      <td key={cat} className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRoleCategory(role, cat)}
                          className="rounded border-slate-300 cursor-pointer"
                          aria-label={`${t(ROLE_LABEL_KEYS[role])} ${t(CATEGORY_LABEL_KEYS[cat])}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className={ST_FORM_FOOTER}>
          <button type="button" onClick={handleReset} className={FORM_BTN_SECONDARY}>
            {labels.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${FORM_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Saving…' : labels.save}
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
}
