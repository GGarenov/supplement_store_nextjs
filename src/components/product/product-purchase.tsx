"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { AddToCartButton } from "./add-to-cart-button";

const MAX_PER_ORDER = 10;

/** Quantity stepper and "Add to cart" on the product page. */
export function ProductPurchase({
  productName,
  stock,
}: {
  productName: string;
  stock: number;
}) {
  const max = Math.min(stock, MAX_PER_ORDER);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex gap-3">
      {stock > 0 && (
        <div
          className="flex items-center rounded-lg border"
          role="group"
          aria-label="Quantity"
        >
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => q - 1)}
          >
            <MinusIcon />
          </Button>
          <output
            aria-live="polite"
            className="w-8 text-center font-semibold tabular-nums"
          >
            {quantity}
          </output>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Increase quantity"
            disabled={quantity >= max}
            onClick={() => setQuantity((q) => q + 1)}
          >
            <PlusIcon />
          </Button>
        </div>
      )}
      <AddToCartButton
        productName={productName}
        quantity={quantity}
        inStock={stock > 0}
        size="lg"
        className="h-11 flex-1"
      />
    </div>
  );
}
