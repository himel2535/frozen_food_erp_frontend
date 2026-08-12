import {
  API_RESOURCE_PATHS,
  type ApiModule,
} from '@/lib/config/data-source';
import { fetchServerResourceList } from '@/lib/server/fetch-resource-list';

export type ApiModuleSnapshot = Partial<Record<ApiModule, Record<string, unknown>[]>>;

export async function fetchModuleList(
  module: ApiModule,
  revalidateSeconds = 30,
): Promise<Record<string, unknown>[]> {
  const path = API_RESOURCE_PATHS[module];
  return fetchServerResourceList(path, revalidateSeconds);
}

export async function fetchModulesSnapshot(
  modules: readonly ApiModule[],
  revalidateSeconds = 30,
): Promise<ApiModuleSnapshot> {
  const results = await Promise.allSettled(
    modules.map(async (mod) => {
      const docs = await fetchModuleList(mod, revalidateSeconds);
      return [mod, docs] as const;
    }),
  );

  const snapshot: ApiModuleSnapshot = {};
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const [mod, docs] = result.value;
    snapshot[mod] = docs;
  }
  return snapshot;
}
