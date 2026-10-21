/**
 * Effective-price logic. Pure functions with no database access, so the same
 * rules apply on product cards, the product page, the cart and checkout, and
 * they're easy to unit-test.
 */

/** An active promotion, with its category target expanded to the whole subtree. */
export type ActivePromotion = {
  id: string;
  name: string;
  percentOff: number;
  brandId: string | null;
  /** The target category and all its descendants (empty if not a category promotion). */
  categorySlugs: string[];
  productIds: string[];
};

/** The fields a product needs for pricing. */
export type PriceableProduct = {
  id: string;
  brandId: string;
  priceCents: number;
  categorySlugs: string[];
};

export type EffectivePrice = {
  /** What the customer pays. */
  priceCents: number;
  /** The regular price, before any promotion. */
  originalCents: number;
  /** 0 when no promotion applies. */
  percentOff: number;
  promotionId: string | null;
};

export function promotionApplies(
  promotion: ActivePromotion,
  product: PriceableProduct,
): boolean {
  return (
    promotion.brandId === product.brandId ||
    promotion.productIds.includes(product.id) ||
    product.categorySlugs.some((slug) => promotion.categorySlugs.includes(slug))
  );
}

/** Applies the best matching promotion (promotions don't stack). */
export function getEffectivePrice(
  product: PriceableProduct,
  promotions: ActivePromotion[],
): EffectivePrice {
  let best: ActivePromotion | null = null;
  for (const promotion of promotions) {
    if (!promotionApplies(promotion, product)) continue;
    if (!best || promotion.percentOff > best.percentOff) best = promotion;
  }

  if (!best) {
    return {
      priceCents: product.priceCents,
      originalCents: product.priceCents,
      percentOff: 0,
      promotionId: null,
    };
  }
  return {
    priceCents: Math.round(
      (product.priceCents * (100 - best.percentOff)) / 100,
    ),
    originalCents: product.priceCents,
    percentOff: best.percentOff,
    promotionId: best.id,
  };
}
