import { PackageSearchIcon } from "lucide-react";
import Link from "next/link";

import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getFacets, getProducts, type ListingScope } from "@/lib/catalog";
import { countActiveFilters, type Filters } from "@/lib/filters";

import { ActiveFilters } from "./active-filters";
import { CategoryFilter } from "./category-filter";
import { FilterControls } from "./filter-controls";
import { ListingPagination } from "./listing-pagination";
import { MobileFilters } from "./mobile-filters";
import { SortSelect } from "./sort-select";

/**
 * The shared listing UI for category, brand and search pages:
 * filter sidebar (a bottom sheet on mobile), sort, chips, grid and pagination.
 */
export async function ProductListing({
  scope,
  filters,
  pathname,
  category,
  hideBrandFilter = false,
}: {
  scope: ListingScope;
  filters: Filters;
  /** The page's own path, used to build filter and page links. */
  pathname: string;
  /** On category pages: the current category and its top-level group. */
  category?: { activeSlug: string; groupSlug: string };
  hideBrandFilter?: boolean;
}) {
  const [{ items, total, page, pageCount }, facets] = await Promise.all([
    getProducts(scope, filters),
    getFacets(scope, filters),
  ]);
  const activeCount = countActiveFilters(filters);

  const sidebar = (
    <div className="space-y-8 pb-4">
      {category && <CategoryFilter {...category} />}
      <FilterControls
        facets={facets}
        filters={filters}
        hideBrands={hideBrandFilter}
      />
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
      <aside aria-label="Filters" className="hidden lg:block">
        {sidebar}
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {total} {total === 1 ? "product" : "products"}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters activeCount={activeCount} total={total}>
              {sidebar}
            </MobileFilters>
            <SortSelect filters={filters} />
          </div>
        </div>

        <ActiveFilters pathname={pathname} filters={filters} facets={facets} />

        {items.length > 0 ? (
          <ProductGrid products={items} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-16 text-center">
            <PackageSearchIcon className="text-muted-foreground size-10" />
            <p className="font-medium">No products match these filters.</p>
            {activeCount > 0 && (
              <Button asChild variant="outline">
                <Link
                  href={
                    pathname +
                    (filters.q ? `?q=${encodeURIComponent(filters.q)}` : "")
                  }
                >
                  Clear filters
                </Link>
              </Button>
            )}
          </div>
        )}

        <ListingPagination
          pathname={pathname}
          filters={filters}
          page={page}
          pageCount={pageCount}
        />
      </div>
    </div>
  );
}
