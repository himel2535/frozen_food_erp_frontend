import { updateResource } from '@/lib/services/api-resource-service';

export async function patchResourceImageUrl(
  path: string,
  id: string,
  imageUrl: string,
  imagePublicId = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateResource(path, id, { imageUrl, imagePublicId });
}

export async function patchResourceAttachment(
  path: string,
  id: string,
  attachmentUrl: string,
  attachmentPublicId = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const attachmentName = attachmentUrl
    ? (attachmentUrl.split('/').pop()?.split('?')[0] || 'image')
    : '';
  return updateResource(path, id, { attachmentUrl, attachmentPublicId, attachmentName });
}

export async function patchResourceEvidenceImage(
  path: string,
  id: string,
  evidenceImageUrl: string,
  evidenceImagePublicId = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateResource(path, id, { evidenceImageUrl, evidenceImagePublicId });
}
