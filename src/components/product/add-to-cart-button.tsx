"use client";

import { ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Placeholder until the cart exists (Phase 5): it only shows a toast.
export function AddToCartButton({
  productName,
  quantity = 1,
  inStock,
  size = "default",
  className,
}: {
  productName: string;
  quantity?: number;
  inStock: boolean;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <Button
      size={size}
      disabled={!inStock}
      className={cn("w-full", className)}
      onClick={() =>
        toast.info("The cart isn't available yet", {
          description: `${quantity} × ${productName}`,
        })
      }
    >
      <ShoppingBagIcon data-icon="inline-start" />
      {inStock ? "Add to cart" : "Out of stock"}
    </Button>
  );
}
