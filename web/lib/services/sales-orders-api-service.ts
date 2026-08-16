import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { updateResource } from '@/lib/services/api-resource-service';

export async function patchOrderAttachment(
  id: string,
  attachmentUrl: string,
  attachmentPublicId = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const attachmentName = attachmentUrl
    ? (attachmentUrl.split('/').pop()?.split('?')[0] || 'image')
    : '';
  return updateResource(API_RESOURCE_PATHS.salesOrders, id, {
    attachmentUrl,
    attachmentPublicId,
    attachmentName,
    'meta.attachmentUrl': attachmentUrl,
    'meta.attachmentPublicId': attachmentPublicId,
    'meta.attachmentName': attachmentName,
  });
}
