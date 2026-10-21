import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { CategoryTiles } from "@/components/home/category-tiles";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/product/product-grid";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { Button } from "@/components/ui/button";
import { getBestSellers, getFeaturedProducts } from "@/lib/catalog";

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-wide uppercase sm:text-3xl">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-primary text-sm font-medium hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// Products are read at request time (not during the build), inside Suspense.
async function FeaturedProducts() {
  await connection();
  return <ProductGrid products={await getFeaturedProducts(8)} />;
}

async function BestSellers() {
  await connection();
  return <ProductGrid products={await getBestSellers(8)} />;
}

// Phase 8 replaces the hero with the banner carousel and adds the sale and brand sections.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-14 px-4 py-10">
      <section className="flex flex-col items-start gap-5 py-6">
        <h1 className="max-w-2xl text-5xl font-bold tracking-wide uppercase sm:text-6xl">
          Fuel your <span className="text-primary">training</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Protein, creatine, pre-workout and vitamins from the brands athletes
          trust.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/c/protein">Shop protein</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/brands">Browse brands</Link>
          </Button>
        </div>
      </section>

      <Section title="Shop by category">
        <CategoryTiles />
      </Section>

      <Section title="Featured">
        <SectionErrorBoundary message="Featured products couldn't be loaded.">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <FeaturedProducts />
          </Suspense>
        </SectionErrorBoundary>
      </Section>

      <Section title="Best sellers">
        <SectionErrorBoundary message="Best sellers couldn't be loaded.">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <BestSellers />
          </Suspense>
        </SectionErrorBoundary>
      </Section>
    </div>
  );
}
