"use client";

import { HeartIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Placeholder until the wishlist exists (Phase 7): it only shows a toast.
export function WishlistButton({
  productName,
  className,
}: {
  productName: string;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Add ${productName} to wishlist`}
      className={cn("rounded-full", className)}
      onClick={() => toast.info("The wishlist isn't available yet")}
    >
      <HeartIcon />
    </Button>
  );
}
