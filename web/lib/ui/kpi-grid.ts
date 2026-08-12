export function getKpiGridClassName(count: number): string {
  if (count <= 0) return 'hidden';
  if (count === 1) return 'grid grid-cols-1 gap-2';
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-2';
  if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 gap-2';
  if (count === 4) return 'grid grid-cols-2 md:grid-cols-4 gap-2';
  if (count === 5) return 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2';
  if (count === 6) return 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2';
  return 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2';
}
