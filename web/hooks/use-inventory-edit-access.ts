'use client';

import { useCallback, useMemo } from 'react';
import { toast } from '@/lib/ui/feedback';
import { canEditInventory } from '@/lib/services/access-control-service';
import { useAppStore } from '@/lib/state/app-store';

export const INVENTORY_EDIT_DENIED_MESSAGE =
  'You can add and view inventory, but cannot edit or delete existing records. Ask the main admin for edit permission.';

export function useInventoryEditAccess() {
  const authUser = useAppStore((s) => s.authUser);
  const canEdit = useMemo(() => canEditInventory(authUser), [authUser]);

  const guardEdit = useCallback((): boolean => {
    if (canEdit) return true;
    toast.error(INVENTORY_EDIT_DENIED_MESSAGE);
    return false;
  }, [canEdit]);

  return { canEdit, guardEdit };
}
