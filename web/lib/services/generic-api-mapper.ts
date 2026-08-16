import { apiDocId } from '@/lib/services/api-resource-service';

/** Pass-through mapper for flexible MongoDB documents. */
export function mapGenericApiRow(doc: Record<string, unknown>): Record<string, unknown> {
  const mongoId = apiDocId(doc);
  const legacyId = String(doc.legacyId ?? doc.projectId ?? mongoId);
  return {
    ...doc,
    id: legacyId,
    legacyId,
    _mongoId: mongoId,
  };
}

/** Strip empty client ids before POST — backend assigns legacyId. */
export function mapGenericPayloadToApi(form: Record<string, unknown>): Record<string, unknown> {
  const payload = { ...form };
  for (const key of ['id', '_id', '_mongoId', 'legacyId']) {
    delete payload[key];
  }
  const name = String(payload.name ?? '').trim();
  const title = String(payload.title ?? '').trim();
  const asset = String(payload.asset ?? '').trim();
  // List/search profiles key off `name`; UI forms use `title` / `asset`.
  if (!name && (title || asset)) {
    payload.name = title || asset;
  }
  return payload;
}
