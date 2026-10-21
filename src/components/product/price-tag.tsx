import { formatPrice } from "@/lib/format";
import type { EffectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Current price; on sale it also shows the struck-through regular price. */
export function PriceTag({
  price,
  size = "default",
  className,
}: {
  price: EffectivePrice;
  size?: "default" | "lg";
  className?: string;
}) {
  const onSale = price.percentOff > 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-bold",
          size === "lg" ? "text-3xl" : "text-lg",
          onSale && "text-sale",
        )}
      >
        {formatPrice(price.priceCents)}
      </span>
      {onSale && (
        <s
          className={cn(
            "text-muted-foreground",
            size === "lg" ? "text-lg" : "text-sm",
          )}
        >
          <span className="sr-only">Regular price </span>
          {formatPrice(price.originalCents)}
        </s>
      )}
    </div>
  );
}
