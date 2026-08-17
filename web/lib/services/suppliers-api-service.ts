import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { updateResource } from '@/lib/services/api-resource-service';

export async function patchSupplierImageUrl(
  id: string,
  imageUrl: string,
  imagePublicId = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateResource(API_RESOURCE_PATHS.suppliers, id, { imageUrl, imagePublicId });
}
