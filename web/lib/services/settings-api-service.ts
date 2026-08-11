import {
  createResource,
  fetchResourceList,
  updateResource,
} from '@/lib/services/api-resource-service';
import { findSettingsDocId, settingsDocBody } from '@/lib/services/api-app-state-mapper';
import { isModuleApiMode } from '@/lib/config/data-source';

const PATH = '/company-settings';

let cachedDocs: Record<string, unknown>[] | null = null;

export async function fetchSettingsDocs(force = false) {
  if (!isModuleApiMode('companySettings')) return [];
  if (cachedDocs && !force) return cachedDocs;
  cachedDocs = await fetchResourceList(PATH);
  return cachedDocs;
}

export async function saveSettingsDoc(key: string, payload: unknown) {
  if (!isModuleApiMode('companySettings')) return { ok: false as const, error: 'API mode off' };
  const docs = await fetchSettingsDocs(true);
  const existingId = findSettingsDocId(docs, key);
  const body = settingsDocBody(key, payload);
  const result = existingId
    ? await updateResource(PATH, existingId, body)
    : await createResource(PATH, body);
  if (result.ok) cachedDocs = null;
  return result;
}

export function invalidateSettingsCache() {
  cachedDocs = null;
}
