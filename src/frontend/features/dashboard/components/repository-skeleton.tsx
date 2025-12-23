import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RepositorySkeletonProps = {
  count?: number;
};

const SingleRepositorySkeleton = () => {
  return (
    <Card aria-label="Loading repository" className="relative h-full p-4" role="status">
      {/* Header: Repo name + Bookmark */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="size-8 rounded-md" />
      </div>

      {/* Content: Test count + badges */}
      <div className="space-y-3">
        {/* Test count */}
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>

        {/* Footer: Time + Reanalyze */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </Card>
  );
};

export const RepositorySkeleton = ({ count = 1 }: RepositorySkeletonProps) => {
  if (count === 1) {
    return <SingleRepositorySkeleton />;
  }

  return (
    <div aria-label="Loading repositories" aria-live="polite" role="status">
      {Array.from({ length: count }).map((_, index) => (
        <SingleRepositorySkeleton key={index} />
      ))}
    </div>
  );
};
