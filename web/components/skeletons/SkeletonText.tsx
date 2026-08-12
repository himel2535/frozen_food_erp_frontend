type SkeletonTextProps = {
  className?: string;
};

export function SkeletonText({ className = '' }: SkeletonTextProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
