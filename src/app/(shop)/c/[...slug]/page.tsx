import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageBreadcrumb } from "@/components/catalog/page-breadcrumb";
import { ProductListing } from "@/components/catalog/product-listing";
import { findCategoryByPath, getSubtreeSlugs } from "@/lib/categories";
import { parseFilters } from "@/lib/filters";

export async function generateMetadata({
  params,
}: PageProps<"/c/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = findCategoryByPath(slug);
  if (!found) return {};
  return {
    title: found.category.name,
    description: `Shop ${found.category.name.toLowerCase()} supplements from top brands at Healthy Street.`,
  };
}

// params and searchParams are request-time data; loading.tsx is the Suspense fallback.
export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/c/[...slug]">) {
  const { slug } = await params;
  const found = findCategoryByPath(slug);
  if (!found) notFound();

  const { category, trail } = found;
  const filters = parseFilters(await searchParams);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <PageBreadcrumb
        items={trail.map((c) => ({ label: c.name, href: c.href }))}
      />
      <h1 className="text-3xl font-bold tracking-wide uppercase sm:text-4xl">
        {category.name}
      </h1>
      <ProductListing
        scope={{ categorySlugs: getSubtreeSlugs(category) }}
        filters={filters}
        pathname={category.href}
        category={{ activeSlug: category.slug, groupSlug: trail[0].slug }}
      />
    </div>
  );
}
