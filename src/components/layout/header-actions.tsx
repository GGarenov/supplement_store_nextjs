import { HeartIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { ThemeToggle } from "./theme-toggle";

function IconLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button asChild variant="ghost" size="icon" className={className}>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

/**
 * Theme toggle, wishlist, account and cart.
 * Placeholders for now: the account dropdown comes in Phase 4, the cart count in Phase 5.
 */
export function HeaderActions({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      <ThemeToggle />
      <IconLink
        href="/account/wishlist"
        label="Wishlist"
        className="hidden sm:inline-flex"
      >
        <HeartIcon />
      </IconLink>
      <IconLink href="/login" label="Sign in">
        <UserIcon />
      </IconLink>
      <IconLink
        href="/cart"
        label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
        className="relative"
      >
        <ShoppingBagIcon />
        {cartCount > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full text-[0.65rem] font-bold">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </IconLink>
    </div>
  );
}
