import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { ProductCardData } from "@/lib/catalog";
import { cn } from "@/lib/utils";

import { AddToCartButton } from "./add-to-cart-button";
import { PriceTag } from "./price-tag";
import { RatingStars } from "./rating-stars";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  /** Set for cards visible on first load (above the fold). */
  priority?: boolean;
}) {
  const href = `/p/${product.slug}`;
  const inStock = product.stock > 0;

  return (
    <article className="group bg-card relative flex w-full flex-col gap-2 rounded-xl border p-3">
      {/* The whole card is clickable through the stretched name link below. */}
      <div className="bg-tile relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={product.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn(
            "object-contain p-3 transition-transform duration-300 group-hover:scale-105",
            !inStock && "opacity-50",
          )}
        />
        <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.price.percentOff > 0 && (
            <Badge className="bg-sale text-sale-foreground">
              −{product.price.percentOff}%
            </Badge>
          )}
          {!inStock && <Badge variant="secondary">Out of stock</Badge>}
        </span>
      </div>

      <WishlistButton
        productName={product.name}
        className="bg-background/80 absolute top-5 right-5 z-10 backdrop-blur"
      />

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/brands/${product.brandSlug}`}
          className="text-muted-foreground hover:text-foreground relative z-10 w-fit text-xs font-medium tracking-wide uppercase"
        >
          {product.brandName}
        </Link>
        <h3 className="font-sans text-sm leading-snug font-medium">
          <Link
            href={href}
            className="hover:text-primary line-clamp-2 min-h-[2lh] after:absolute after:inset-0 after:content-['']"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-muted-foreground text-xs">{product.packLabel}</p>
        <RatingStars rating={product.ratingAvg} count={product.ratingCount} />
        <PriceTag price={product.price} className="mt-auto pt-1" />
      </div>

      {/* Revealed on hover with a mouse; always visible on touch screens. */}
      <AddToCartButton
        productName={product.name}
        inStock={inStock}
        className="relative z-10 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
      />
    </article>
  );
}
