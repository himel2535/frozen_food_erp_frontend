import { SkeletonText } from '@/components/skeletons/SkeletonText';

type SkeletonTableRowProps = {
  columns: number;
  className?: string;
};

export function SkeletonTableRow({ columns, className = '' }: SkeletonTableRowProps) {
  return (
    <tr className={className} aria-hidden="true">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={`cell-${index}`} className="px-3 py-3">
          <SkeletonText className={`h-4 ${index === 0 ? 'w-8' : 'w-full max-w-[120px]'}`} />
        </td>
      ))}
    </tr>
  );
}
