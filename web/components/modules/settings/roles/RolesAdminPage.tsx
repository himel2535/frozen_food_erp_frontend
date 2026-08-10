'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { RoleFormView, type RoleFormState } from '@/components/modules/settings/roles/RoleFormView';
import { useAppStore } from '@/lib/state/app-store';
import { isMainAdmin, summarizeRoleSections } from '@/lib/services/access-control-service';
import {
  createAdminRole,
  deactivateAdminRole,
  fetchAdminRoles,
  fetchRoleUserCounts,
  updateAdminRole,
} from '@/lib/services/admin-roles-api';
import { createAdminUser } from '@/lib/services/admin-users-api';
import { getSectionOptions } from '@/lib/navigation/section-access';
import type { RoleRecord, SectionId } from '@/lib/state/types';
import { toast, confirmAction } from '@/lib/ui/feedback';

type View = 'list' | 'form';

type FormState = RoleFormState;

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  contactEmail: '',
  notes: '',
  status: 'active',
  allowedSections: ['dashboard'],
  provisionName: '',
  provisionEmail: '',
  provisionPassword: '',
};

type RoleRow = RoleRecord & { userCount: number };

export function RolesAdminPage() {
  const t = useAppStore((s) => s.t);
  const authUser = useAppStore((s) => s.authUser);
  const canManage = isMainAdmin(authUser);

  const [view, setView] = useState<View>('list');
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useChromeSuppressed(view === 'form');

  const sectionOptions = useMemo(() => getSectionOptions(), []);

  const loadRoles = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const roles = await fetchAdminRoles();
      let counts: Record<string, number> = {};
      try {
        counts = await fetchRoleUserCounts();
      } catch {
        // User counts need parent read on toysfactory/auth/users (main-admin rule).
        counts = {};
      }
      setRows(
        roles.map((role) => ({
          ...role,
          userCount: counts[role.id] ?? 0,
        })),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setShowAdvanced(false);
    setView('form');
  }, []);

  const openEdit = useCallback((row: RoleRow) => {
    setForm({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      contactEmail: row.contactEmail ?? '',
      notes: row.notes ?? '',
      status: row.status,
      allowedSections: [...row.allowedSections],
      provisionName: '',
      provisionEmail: '',
      provisionPassword: '',
    });
    setShowAdvanced(false);
    setView('form');
  }, []);

  useRegisterModuleActions(
    canManage && view === 'list' ? (
      <button type="button" onClick={openCreate} className={CF_BTN_PRIMARY}>
        <Plus className="w-4 h-4" /> {t('settings.roles_add')}
      </button>
    ) : null,
    [canManage, view, openCreate, t],
  );

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active').length;
    const assigned = rows.reduce((sum, r) => sum + r.userCount, 0);
    const unassigned = rows.filter((r) => r.userCount === 0).length;
    return [
      { key: 'total', label: t('settings.roles_kpi_total'), value: String(rows.length) },
      { key: 'active', label: t('settings.roles_kpi_active'), value: String(active) },
      { key: 'inactive', label: t('settings.roles_kpi_inactive'), value: String(rows.length - active) },
      { key: 'assigned', label: t('settings.roles_kpi_assigned'), value: String(assigned) },
      { key: 'unassigned', label: t('settings.roles_kpi_unassigned'), value: String(unassigned) },
    ];
  }, [rows, t]);

  const columns = useMemo<AppTableColumn<RoleRow>[]>(() => [
    {
      key: 'name',
      label: t('settings.roles_col_role'),
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          {row.description ? (
            <div className="text-[11px] text-slate-500 line-clamp-1">{row.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'email',
      label: t('settings.roles_col_email'),
      render: (row) => (
        <span className="text-slate-600 text-xs">{row.contactEmail || '—'}</span>
      ),
    },
    {
      key: 'access',
      label: t('settings.roles_col_access'),
      render: (row) => (
        <span className="text-slate-600 text-xs">{summarizeRoleSections(row.allowedSections)}</span>
      ),
    },
    {
      key: 'users',
      label: t('settings.roles_col_users'),
      render: (row) => String(row.userCount),
    },
    {
      key: 'status',
      label: t('settings.roles_col_status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
  ], [t]);

  const toggleSection = (id: SectionId) => {
    setForm((prev) => {
      const has = prev.allowedSections.includes(id);
      return {
        ...prev,
        allowedSections: has
          ? prev.allowedSections.filter((s) => s !== id)
          : [...prev.allowedSections, id],
      };
    });
  };

  const handlePresetSelect = (preset: {
    name: string;
    description: string;
    allowedSections: SectionId[];
  }) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      description: preset.description,
      allowedSections: [...preset.allowedSections],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || saving) return;

    if (!form.name.trim()) {
      toast.error(t('settings.roles_name_required'));
      return;
    }
    if (form.allowedSections.length === 0) {
      toast.error(t('settings.roles_sections_required'));
      return;
    }
    if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      toast.error(t('settings.roles_email_invalid'));
      return;
    }

    const wantsProvision = Boolean(form.provisionEmail.trim());
    if (wantsProvision && !form.id) {
      if (!form.provisionName.trim()) {
        toast.error(t('settings.roles_provision_name_required'));
        return;
      }
      if (form.provisionPassword.length < 6) {
        toast.error(t('settings.roles_provision_password_required'));
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        notes: form.notes.trim() || undefined,
        allowedSections: form.allowedSections,
        status: form.status,
      };

      let savedRole: RoleRecord;
      if (form.id) {
        savedRole = await updateAdminRole({ id: form.id, ...payload });
        toast.success(t('settings.roles_updated'));
      } else {
        savedRole = await createAdminRole(payload);
        toast.success(t('settings.roles_created'));

        if (wantsProvision) {
          await createAdminUser({
            name: form.provisionName.trim(),
            email: form.provisionEmail.trim(),
            password: form.provisionPassword,
            allowedSections: savedRole.allowedSections,
            roleId: savedRole.id,
          });
          toast.success(t('settings.roles_provision_success'));
        }
      }

      setView('list');
      await loadRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (row: RoleRow) => {
    const ok = await confirmAction({
      title: t('settings.roles_deactivate_title'),
      message: row.userCount > 0
        ? t('settings.roles_deactivate_with_users', { name: row.name, count: String(row.userCount) })
        : t('settings.roles_deactivate_confirm', { name: row.name }),
      confirmLabel: t('settings.roles_deactivate_btn'),
      tone: 'danger',
      module: 'Roles',
    });
    if (!ok) return;
    try {
      await deactivateAdminRole(row.id);
      toast.success(t('settings.roles_deactivated'));
      await loadRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate role');
    }
  };

  if (!canManage) {
    return (
      <div className="mt-8 premium-card p-8 text-center">
        <h3 className="text-lg font-bold text-slate-900">{t('settings.roles_access_denied_title')}</h3>
        <p className="text-sm text-slate-500 mt-2">{t('settings.roles_access_denied_desc')}</p>
      </div>
    );
  }

  if (view === 'form') {
    const isEdit = Boolean(form.id);
    return (
      <RoleFormView
        form={form}
        setForm={setForm}
        existingRoles={rows}
        sectionTotal={sectionOptions.length}
        isEdit={isEdit}
        saving={saving}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        onBack={() => setView('list')}
        onSubmit={handleSave}
        onPresetSelect={handlePresetSelect}
        onToggleSection={toggleSection}
        onSelectAllSections={() =>
          setForm((f) => ({ ...f, allowedSections: sectionOptions.map((s) => s.id) }))
        }
        onClearAllSections={() =>
          setForm((f) => ({ ...f, allowedSections: ['dashboard'] }))
        }
        t={t}
      />
    );
  }

  return (
    <>
      <ModuleKpiSection items={kpis} loading={loading && rows.length === 0} />
      <div className="premium-card overflow-hidden">
        <AppTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyMessage={loading ? t('settings.roles_loading') : t('settings.roles_empty')}
          renderActions={(row) => (
            <div className="flex items-center gap-2">
              <TableIconAction variant="edit" onClick={() => openEdit(row)} />
              {row.status === 'active' ? (
                <TableIconAction variant="delete" onClick={() => void handleDeactivate(row)} />
              ) : null}
            </div>
          )}
        />
      </div>
      <Footer />
    </>
  );
}
