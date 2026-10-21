import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageBreadcrumb } from "@/components/catalog/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { getBrandsWithCounts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Brands",
  description: "All supplement brands at Healthy Street, from A to Z.",
};

function letterOf(name: string): string {
  const c = name.trim()[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(c) ? c : "#";
}

async function BrandIndex() {
  // Read the brands at request time, not during the build.
  await connection();
  const brands = (await getBrandsWithCounts()).filter(
    (b) => b._count.products > 0,
  );

  const groups = new Map<string, typeof brands>();
  for (const brand of brands) {
    const letter = letterOf(brand.name);
    groups.set(letter, [...(groups.get(letter) ?? []), brand]);
  }
  const letters = [...groups.keys()].sort((a, b) =>
    a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b),
  );

  return (
    <>
      <nav aria-label="Brands by letter" className="border-b pb-3">
        <ul className="flex flex-wrap gap-1">
          {letters.map((letter) => (
            <li key={letter}>
              <a
                href={`#letter-${letter}`}
                className="hover:bg-muted flex size-8 items-center justify-center rounded-md text-sm font-semibold"
              >
                {letter}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-8">
        {letters.map((letter) => (
          // Scroll margin keeps the letter heading clear of the sticky header.
          <section
            key={letter}
            id={`letter-${letter}`}
            className="scroll-mt-36 md:scroll-mt-24 lg:scroll-mt-32"
          >
            <h2 className="text-primary mb-3 text-2xl font-bold">{letter}</h2>
            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {groups.get(letter)!.map((brand) => (
                <li key={brand.slug}>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="hover:text-primary flex items-baseline justify-between gap-2 border-b py-1.5"
                  >
                    <span
                      className={brand.featured ? "font-semibold" : undefined}
                    >
                      {brand.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {brand._count.products}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function BrandIndexSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 24 }, (_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}

export default function BrandsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <PageBreadcrumb items={[{ label: "Brands" }]} />
      <h1 className="text-3xl font-bold tracking-wide uppercase sm:text-4xl">
        Brands A–Z
      </h1>
      <Suspense fallback={<BrandIndexSkeleton />}>
        <BrandIndex />
      </Suspense>
    </div>
  );
}
