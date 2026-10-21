import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCardData } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";

export function ProductGrid({
  products,
  className,
}: {
  products: ProductCardData[];
  className?: string;
}) {
  return (
    <ul className={cn(GRID, className)}>
      {products.map((product, i) => (
        <li key={product.id} className="flex">
          {/* The first row is usually above the fold, so load those images first. */}
          <ProductCard product={product} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(GRID, className)}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border p-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-1 h-5 w-1/4" />
        </div>
      ))}
    </div>
  );
}
