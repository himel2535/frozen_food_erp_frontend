/** Granular permissions beyond section-level access. */
export const INVENTORY_EDIT_PERMISSION = 'inventory:edit' as const;

export type GranularPermission = typeof INVENTORY_EDIT_PERMISSION;

export const GRANULAR_PERMISSION_LABELS: Record<GranularPermission, string> = {
  [INVENTORY_EDIT_PERMISSION]: 'Edit & delete inventory records',
};

export function hasGranularPermission(
  permissions: readonly string[] | undefined,
  permission: GranularPermission,
): boolean {
  return (permissions ?? []).includes(permission);
}
