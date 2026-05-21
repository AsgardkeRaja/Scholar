import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-center mb-8">
        <Skeleton className="h-12 w-full max-w-2xl rounded-full bg-white/5" />
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl glass-panel p-6 space-y-4">
            <Skeleton className="h-6 w-3/4 bg-white/5 rounded-lg" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-1/4 bg-white/5 rounded-lg" />
              <Skeleton className="h-4 w-1/4 bg-white/5 rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full bg-white/5 rounded-lg" />
            <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-20 bg-white/5 rounded-full" />
                <Skeleton className="h-8 w-20 bg-white/5 rounded-full" />
                <Skeleton className="h-8 w-20 bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
