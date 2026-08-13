import { apiRequest } from '@/lib/services/api-client';
import { apiDocId } from '@/lib/services/api-resource-service';
import type { RoleRecord, SectionId } from '@/lib/state/types';

export async function fetchAdminRoles(): Promise<RoleRecord[]> {
  const { data } = await apiRequest<any[]>('/roles');
  const roles = (data || []).map((r: any) => ({
    id: apiDocId(r),
    name: r.name,
    description: r.description,
    contactEmail: r.contactEmail,
    notes: r.notes,
    allowedSections: r.allowedSections || [],
    status: r.status,
    isPreset: r.isPreset,
    createdAt: r.createdAt || new Date().toISOString(),
    createdBy: r.createdBy
  }));
  roles.sort((a: any, b: any) => {
    const diff = String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
  return roles;
}

export async function fetchRoleUserCounts(): Promise<Record<string, number>> {
  // Since we removed Firebase, we can either get counts from backend or just fetch all users and count.
  // For simplicity and since admin lists are usually small, we fetch all users and count here.
  const { data } = await apiRequest<any[]>('/admin/users');
  const counts: Record<string, number> = {};
  for (const user of (data || [])) {
    const roleId = user.roleId ? String(user.roleId) : '';
    if (roleId) counts[roleId] = (counts[roleId] ?? 0) + 1;
  }
  return counts;
}

export async function createAdminRole(payload: {
  name: string;
  description?: string;
  contactEmail?: string;
  notes?: string;
  allowedSections: SectionId[];
  status?: 'active' | 'inactive';
  isPreset?: boolean;
}): Promise<RoleRecord> {
  const name = String(payload.name ?? '').trim();
  if (!name) throw new Error('Role name is required');

  const { data } = await apiRequest<any>('/roles', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: payload.description?.trim() || undefined,
      contactEmail: payload.contactEmail?.trim().toLowerCase() || undefined,
      notes: payload.notes?.trim() || undefined,
      allowedSections: payload.allowedSections,
      status: payload.status === 'inactive' ? 'inactive' : 'active',
      isPreset: Boolean(payload.isPreset)
    })
  });

  return {
    id: apiDocId(data),
    name: data.name,
    description: data.description,
    contactEmail: data.contactEmail,
    notes: data.notes,
    allowedSections: data.allowedSections || [],
    status: data.status,
    isPreset: data.isPreset,
    createdAt: data.createdAt,
    createdBy: data.createdBy
  };
}

export async function updateAdminRole(payload: {
  id: string;
  name?: string;
  description?: string;
  contactEmail?: string;
  notes?: string;
  allowedSections?: SectionId[];
  status?: 'active' | 'inactive';
}): Promise<RoleRecord> {
  const id = String(payload.id ?? '').trim();
  if (!id) throw new Error('Role id is required');

  const { data } = await apiRequest<any>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: payload.name?.trim(),
      description: payload.description?.trim(),
      contactEmail: payload.contactEmail?.trim().toLowerCase(),
      notes: payload.notes?.trim(),
      allowedSections: payload.allowedSections,
      status: payload.status
    })
  });

  return {
    id: apiDocId(data),
    name: data.name,
    description: data.description,
    contactEmail: data.contactEmail,
    notes: data.notes,
    allowedSections: data.allowedSections || [],
    status: data.status,
    isPreset: data.isPreset,
    createdAt: data.createdAt,
    createdBy: data.createdBy
  };
}

export async function deactivateAdminRole(id: string): Promise<void> {
  const roleId = String(id ?? '').trim();
  if (!roleId) throw new Error('Role id is required');

  const counts = await fetchRoleUserCounts();
  if ((counts[roleId] ?? 0) > 0) {
    await apiRequest(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'inactive' })
    });
    return;
  }

  await apiRequest(`/roles/${roleId}`, {
    method: 'DELETE'
  });
}
