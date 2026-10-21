import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageBreadcrumb } from "@/components/catalog/page-breadcrumb";
import { ProductListing } from "@/components/catalog/product-listing";
import { getBrand } from "@/lib/catalog";
import { parseFilters } from "@/lib/filters";

export async function generateMetadata({
  params,
}: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const brand = await getBrand((await params).slug);
  if (!brand) return {};
  return {
    title: brand.name,
    description: `Shop ${brand.name} supplements at Healthy Street.`,
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: PageProps<"/brands/[slug]">) {
  const brand = await getBrand((await params).slug);
  if (!brand) notFound();

  const filters = parseFilters(await searchParams);
  // A brand filter in the URL would fight with the page's own brand.
  filters.brands = [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <PageBreadcrumb
        items={[{ label: "Brands", href: "/brands" }, { label: brand.name }]}
      />
      <h1 className="text-3xl font-bold tracking-wide uppercase sm:text-4xl">
        {brand.name}
      </h1>
      <ProductListing
        scope={{ brandSlug: brand.slug }}
        filters={filters}
        pathname={`/brands/${brand.slug}`}
        hideBrandFilter
      />
    </div>
  );
}
