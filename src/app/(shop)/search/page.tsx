import type { Metadata } from "next";

import { PageBreadcrumb } from "@/components/catalog/page-breadcrumb";
import { ProductListing } from "@/components/catalog/product-listing";
import { SearchForm } from "@/components/layout/search-form";
import { parseFilters } from "@/lib/filters";

export async function generateMetadata({
  searchParams,
}: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseFilters(await searchParams);
  return {
    title: q ? `Search: ${q}` : "Search",
    // Result pages are endless variations; keep them out of search engines.
    robots: { index: false },
  };
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const filters = parseFilters(await searchParams);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <PageBreadcrumb items={[{ label: "Search" }]} />
      {filters.q ? (
        <>
          <h1 className="text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Results for “{filters.q}”
          </h1>
          <ProductListing
            scope={{ q: filters.q }}
            filters={filters}
            pathname="/search"
          />
        </>
      ) : (
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Search
          </h1>
          <p className="text-muted-foreground">
            Search by product name or brand, e.g. “creatine” or “ostrovit”.
          </p>
          <SearchForm />
        </div>
      )}
    </div>
  );
}
