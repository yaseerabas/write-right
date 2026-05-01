import { Skeleton } from "@/components/ui/skeleton";

export const TextSkeleton = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2.5 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-3.5 rounded-md ${i === lines - 1 ? "w-3/4" : "w-full"}`}
      />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="p-5 space-y-3.5">
    <Skeleton className="h-5 w-2/3 rounded-md" />
    <Skeleton className="h-3.5 w-full rounded-md" />
    <Skeleton className="h-3.5 w-5/6 rounded-md" />
    <Skeleton className="h-9 w-24 rounded-lg" />
  </div>
);

export const ToolCardSkeleton = () => (
  <div className="p-4 space-y-3 border rounded-xl">
    <Skeleton className="h-9 w-9 rounded-lg" />
    <Skeleton className="h-3.5 w-20 rounded-md" />
    <Skeleton className="h-3 w-full rounded-md" />
  </div>
);

export const ButtonSkeleton = () => (
  <Skeleton className="h-11 w-full rounded-lg" />
);
