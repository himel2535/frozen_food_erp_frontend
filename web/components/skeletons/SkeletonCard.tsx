import { SkeletonText } from '@/components/skeletons/SkeletonText';

type SkeletonCardProps = {
  className?: string;
  showIcon?: boolean;
};

export function SkeletonCard({ className = '', showIcon = true }: SkeletonCardProps) {
  return (
    <div
      className={`premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 min-h-[80px] ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1">
        <SkeletonText className="h-3 w-20" />
        <SkeletonText className="h-5 w-24" />
        <SkeletonText className="h-2.5 w-28" />
      </div>
      {showIcon ? <SkeletonText className="w-10 h-10 rounded-xl shrink-0" /> : null}
    </div>
  );
}
