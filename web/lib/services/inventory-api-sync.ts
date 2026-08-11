import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import type { AppState } from '@/lib/state/types';
import {
  listFinishedGoods,
  listRawMaterials,
  listSemiFinishedProducts,
} from '@/lib/services/inventory-service';
import {
  mapFinishedGoodPayloadToApi,
  mapRawMaterialPayloadToApi,
  mapSemiFinishedPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import { updateResource } from '@/lib/services/api-resource-service';
import { notifyApiMutation } from '@/lib/services/api-sync-events';

type InventorySyncTarget = {
  listFn: (state: AppState) => Record<string, unknown>[];
  path: string;
  mapPayload: (body: Record<string, unknown>) => Record<string, unknown>;
  module: 'rawMaterials' | 'semiFinishedProducts' | 'finishedGoods';
};

const INVENTORY_SYNC_TARGETS: InventorySyncTarget[] = [
  {
    listFn: listRawMaterials,
    path: API_RESOURCE_PATHS.rawMaterials,
    mapPayload: mapRawMaterialPayloadToApi,
    module: 'rawMaterials',
  },
  {
    listFn: listSemiFinishedProducts,
    path: API_RESOURCE_PATHS.semiFinishedProducts,
    mapPayload: mapSemiFinishedPayloadToApi,
    module: 'semiFinishedProducts',
  },
  {
    listFn: listFinishedGoods,
    path: API_RESOURCE_PATHS.finishedGoods,
    mapPayload: mapFinishedGoodPayloadToApi,
    module: 'finishedGoods',
  },
];

/** Push quantity changes from a pseudo-state mutator back to MongoDB inventory collections. */
export async function syncInventoryQuantityDeltas(
  before: AppState,
  after: AppState,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const touched: Array<'rawMaterials' | 'semiFinishedProducts' | 'finishedGoods'> = [];

  for (const target of INVENTORY_SYNC_TARGETS) {
    const beforeMap = new Map(
      target.listFn(before).map((row) => [String(row.id), Number(row.quantity ?? 0)]),
    );

    for (const row of target.listFn(after)) {
      const id = String(row.id);
      const prevQty = beforeMap.get(id);
      if (prevQty === undefined) continue;
      const nextQty = Number(row.quantity ?? 0);
      if (nextQty === prevQty) continue;

      const result = await updateResource(target.path, id, target.mapPayload(row));
      if (!result.ok) {
        return { ok: false, error: 'error' in result ? String(result.error) : 'Inventory sync failed' };
      }
      touched.push(target.module);
    }
  }

  if (touched.length) notifyApiMutation(touched);
  return { ok: true };
}
