import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageBreadcrumb } from "@/components/catalog/page-breadcrumb";
import { PriceTag } from "@/components/product/price-tag";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/product/product-grid";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductReviews } from "@/components/product/product-reviews";
import { RatingStars } from "@/components/product/rating-stars";
import { WishlistButton } from "@/components/product/wishlist-button";
import { SectionErrorBoundary } from "@/components/section-error-boundary";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getCategoryTrail } from "@/lib/categories";
import { FORM_LABELS } from "@/lib/filters";
import { formatPrice } from "@/lib/format";

const LOW_STOCK = 10;

export async function generateMetadata({
  params,
}: PageProps<"/p/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: `${product.brand.name} ${product.name}`,
    description: product.description ?? undefined,
    openGraph: { images: [product.image] },
  };
}

function StockStatus({ stock }: { stock: number }) {
  if (stock === 0)
    return <p className="text-destructive text-sm font-medium">Out of stock</p>;
  if (stock <= LOW_STOCK) {
    return <p className="text-sale text-sm font-medium">Only {stock} left</p>;
  }
  return <p className="text-primary text-sm font-medium">In stock</p>;
}

async function RelatedProducts({
  productId,
  categorySlugs,
}: {
  productId: string;
  categorySlugs: string[];
}) {
  const products = await getRelatedProducts(productId, categorySlugs);
  if (products.length === 0) return null;
  return <ProductGrid products={products} />;
}

export default async function ProductPage({ params }: PageProps<"/p/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const trail = getCategoryTrail(product.categorySlugs[0] ?? "");
  const brandHref = `/brands/${product.brand.slug}`;

  // Structured data so search engines can show price, stock and rating.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (product.price.priceCents / 100).toFixed(2),
      availability: `https://schema.org/${product.stock > 0 ? "InStock" : "OutOfStock"}`,
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.ratingAvg.toFixed(1),
        reviewCount: product.ratingCount,
      },
    }),
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-6">
      <script
        type="application/ld+json"
        // JSON.stringify output can't close the script tag once "<" is escaped.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="space-y-6">
        <PageBreadcrumb
          items={[
            ...trail.map((c) => ({ label: c.name, href: c.href })),
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          <div className="bg-tile relative aspect-square overflow-hidden rounded-2xl">
            <Image
              src={product.image}
              alt={`${product.brand.name} ${product.name}`}
              fill
              priority
              sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
              className="object-contain p-8"
            />
            {product.price.percentOff > 0 && (
              <Badge className="bg-sale text-sale-foreground absolute top-4 left-4 text-sm">
                −{product.price.percentOff}%
              </Badge>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Link
                href={brandHref}
                className="text-muted-foreground hover:text-primary text-sm font-semibold tracking-wide uppercase"
              >
                {product.brand.name}
              </Link>
              <h1 className="font-sans text-2xl leading-tight font-bold sm:text-3xl">
                {product.name}
              </h1>
              <a href="#reviews-heading" className="inline-block">
                <RatingStars
                  rating={product.ratingAvg}
                  count={product.ratingCount}
                  size="md"
                />
              </a>
            </div>

            <dl className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div className="flex gap-1">
                <dt>Pack:</dt>
                <dd className="text-foreground">{product.packLabel}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Form:</dt>
                <dd className="text-foreground">{FORM_LABELS[product.form]}</dd>
              </div>
            </dl>

            <div className="space-y-1">
              <PriceTag price={product.price} size="lg" />
              {product.price.percentOff > 0 && (
                <p className="text-sale text-sm">
                  You save{" "}
                  {formatPrice(
                    product.price.originalCents - product.price.priceCents,
                  )}
                </p>
              )}
            </div>

            <StockStatus stock={product.stock} />

            <div className="flex gap-3">
              <div className="flex-1">
                <ProductPurchase
                  productName={product.name}
                  stock={product.stock}
                />
              </div>
              <WishlistButton productName={product.name} className="size-11" />
            </div>

            {product.description && (
              <div className="space-y-2 border-t pt-5">
                <h2 className="font-sans text-base font-semibold">
                  Description
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        ratingAvg={product.ratingAvg}
        ratingCount={product.ratingCount}
        reviews={product.reviews}
      />

      <section aria-labelledby="related-heading" className="space-y-6">
        <h2
          id="related-heading"
          className="text-2xl font-bold tracking-wide uppercase"
        >
          You may also like
        </h2>
        <SectionErrorBoundary message="Related products couldn't be loaded.">
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <RelatedProducts
              productId={product.id}
              categorySlugs={product.categorySlugs}
            />
          </Suspense>
        </SectionErrorBoundary>
      </section>
    </div>
  );
}
