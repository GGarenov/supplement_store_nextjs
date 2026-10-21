import { ProductGridSkeleton } from "@/components/product/product-grid";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading state for listing pages (category, brand, search). */
export function ListingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
