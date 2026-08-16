import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { apiRequest } from '@/lib/services/api-client';
import { updateResource } from '@/lib/services/api-resource-service';

export async function fetchNextProductSku(): Promise<string> {
  const { data } = await apiRequest<{ sku: string }>(`${API_RESOURCE_PATHS.products}/next-sku`);
  return String(data?.sku ?? '');
}

export async function patchProductImageUrl(
  id: string,
  imageUrl: string,
  imagePublicId = '',
): Promise<{ ok: true } | { ok: false; error: string }> {
  return updateResource(API_RESOURCE_PATHS.products, id, { imageUrl, imagePublicId });
}
