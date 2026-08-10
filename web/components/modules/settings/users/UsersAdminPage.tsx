'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { UserFormView, type UserFormState } from '@/components/modules/settings/users/UserFormView';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { useAppStore } from '@/lib/state/app-store';
import { isMainAdmin, summarizeSections } from '@/lib/services/access-control-service';
import {
  createAdminUser,
  disableAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '@/lib/services/admin-users-api';
import { fetchAdminRoles } from '@/lib/services/admin-roles-api';
import { getSectionOptions } from '@/lib/navigation/section-access';
import type { AuthUserRecord, RoleRecord, SectionId } from '@/lib/state/types';
import { toast, confirmAction } from '@/lib/ui/feedback';

type View = 'list' | 'form';

type FormState = UserFormState;

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  status: 'active',
  isMainAdmin: false,
  roleId: '',
  customizeAccess: false,
  allowedSections: ['dashboard'],
};

export function UsersAdminPage() {
  const t = useAppStore((s) => s.t);
  const authUser = useAppStore((s) => s.authUser);
  const canManage = isMainAdmin(authUser);

  const [view, setView] = useState<View>('list');
  const [rows, setRows] = useState<AuthUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [roles, setRoles] = useState<RoleRecord[]>([]);

  useChromeSuppressed(view === 'form');

  const sectionOptions = useMemo(() => getSectionOptions(), []);

  const loadUsers = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const [users, roleList] = await Promise.all([fetchAdminUsers(), fetchAdminRoles()]);
      setRows(users);
      setRoles(roleList.filter((r) => r.status === 'active'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setShowAdvanced(false);
    setView('form');
  }, []);

  const openEdit = useCallback((row: AuthUserRecord) => {
    setForm({
      uid: row.uid,
      name: row.name,
      email: row.email,
      password: '',
      status: row.status,
      isMainAdmin: Boolean(row.isMainAdmin),
      roleId: row.roleId ?? '',
      customizeAccess: !row.roleId,
      allowedSections: row.allowedSections.includes('*')
        ? sectionOptions.map((s) => s.id)
        : (row.allowedSections.filter((s): s is SectionId => s !== '*')),
    });
    setShowAdvanced(false);
    setView('form');
  }, [sectionOptions]);

  useRegisterModuleActions(
    canManage && view === 'list' ? (
      <button type="button" onClick={openCreate} className={CF_BTN_PRIMARY}>
        <Plus className="w-4 h-4" /> Add User
      </button>
    ) : null,
    [canManage, view, openCreate],
  );

  const kpis = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active').length;
    const admins = rows.filter((r) => r.isMainAdmin).length;
    return [
      { key: 'total', label: 'Total Users', value: String(rows.length) },
      { key: 'active', label: 'Active', value: String(active) },
      { key: 'admins', label: 'Main Admins', value: String(admins) },
    ];
  }, [rows]);

  const columns = useMemo<AppTableColumn<AuthUserRecord>[]>(() => [
    {
      key: 'name',
      label: 'User',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'access',
      label: 'Section Access',
      render: (row) => (
        <span className="text-slate-600 text-xs">{summarizeSections(row)}</span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (row.isMainAdmin ? 'Main Admin' : row.roleName ?? 'Custom'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ], []);

  const toggleSection = (id: SectionId) => {
    if (form.roleId && !form.customizeAccess && !form.isMainAdmin) return;
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

  const handleRoleChange = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    setForm((prev) => ({
      ...prev,
      roleId,
      customizeAccess: false,
      allowedSections: role ? [...role.allowedSections] : prev.allowedSections,
    }));
  };

  const sectionsLocked = Boolean(form.roleId && !form.customizeAccess && !form.isMainAdmin);

  const displaySections = useMemo(() => {
    if (form.isMainAdmin) return sectionOptions.map((s) => s.id);
    return form.allowedSections;
  }, [form.isMainAdmin, form.allowedSections, sectionOptions]);

  const handleSelectAllSections = () => {
    if (sectionsLocked || form.isMainAdmin) return;
    setForm((f) => ({ ...f, allowedSections: sectionOptions.map((s) => s.id) }));
  };

  const handleClearAllSections = () => {
    if (sectionsLocked || form.isMainAdmin) return;
    setForm((f) => ({ ...f, allowedSections: ['dashboard'] }));
  };

  const handleToggleCustomizeAccess = () => {
    setForm((f) => ({ ...f, customizeAccess: !f.customizeAccess }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || saving) return;

    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.uid && !form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!form.uid && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!form.isMainAdmin && form.allowedSections.length === 0) {
      toast.error('Select at least one section');
      return;
    }

    setSaving(true);
    try {
      if (form.uid) {
        await updateAdminUser({
          uid: form.uid,
          name: form.name.trim(),
          allowedSections: form.allowedSections,
          roleId: form.isMainAdmin ? null : (form.roleId || null),
          status: form.status,
          isMainAdmin: form.isMainAdmin,
          password: form.password.trim() || undefined,
        });
        toast.success('User updated');
      } else {
        await createAdminUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          allowedSections: form.allowedSections,
          roleId: form.isMainAdmin ? undefined : (form.roleId || undefined),
          isMainAdmin: form.isMainAdmin,
        });
        toast.success('User created');
      }
      setView('list');
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (row: AuthUserRecord) => {
    if (row.uid === authUser?.uid) {
      toast.error('You cannot disable your own account');
      return;
    }
    const ok = await confirmAction({
      title: 'Disable user',
      message: `Disable ${row.name}? They will not be able to sign in.`,
      confirmLabel: 'Disable',
      tone: 'danger',
      module: 'Users',
    });
    if (!ok) return;
    try {
      await disableAdminUser(row.uid);
      toast.success('User disabled');
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable user');
    }
  };

  if (!canManage) {
    return (
      <div className="mt-8 premium-card p-8 text-center">
        <h3 className="text-lg font-bold text-slate-900">Access restricted</h3>
        <p className="text-sm text-slate-500 mt-2">Only the main admin can manage users.</p>
      </div>
    );
  }

  if (view === 'form') {
    const isEdit = Boolean(form.uid);
    return (
      <UserFormView
        form={form}
        setForm={setForm}
        roles={roles}
        sectionTotal={sectionOptions.length}
        isEdit={isEdit}
        saving={saving}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        sectionsLocked={sectionsLocked}
        displaySections={displaySections}
        onBack={() => setView('list')}
        onSubmit={(e) => void handleSave(e)}
        onRoleChange={handleRoleChange}
        onToggleSection={toggleSection}
        onSelectAllSections={handleSelectAllSections}
        onClearAllSections={handleClearAllSections}
        onToggleCustomizeAccess={handleToggleCustomizeAccess}
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
          rowKey={(row) => row.uid}
          emptyMessage={loading ? 'Loading users...' : 'No users yet. Add the first user.'}
          renderActions={(row) => (
            <div className="flex items-center gap-2">
              <TableIconAction variant="edit" onClick={() => openEdit(row)} />
              {row.status === 'active' && row.uid !== authUser?.uid ? (
                <TableIconAction variant="delete" onClick={() => void handleDisable(row)} />
              ) : null}
            </div>
          )}
        />
      </div>
      <Footer />
    </>
  );
}
