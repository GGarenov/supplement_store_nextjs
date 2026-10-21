import { HeartIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-guards";

import { AccountDropdown } from "./account-dropdown";
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

function SignInLink() {
  return (
    <IconLink href="/login" label="Sign in">
      <UserIcon />
    </IconLink>
  );
}

/** Sign-in icon for guests, avatar menu for logged-in users. Reads the session. */
async function AccountMenu() {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Let Next.js's own signals through (e.g. the prerender ending while the
    // session read is pending, which is how this part becomes dynamic).
    unstable_rethrow(error);
    // The header is in the layout, above the error pages, so a failure here
    // (e.g. AUTH_SECRET missing) would break every page. Show the guest icon instead.
    console.error("AccountMenu: couldn't read the session", error);
  }
  if (!user) return <SignInLink />;
  return (
    <AccountDropdown
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        isAdmin: user.role === "ADMIN",
      }}
    />
  );
}

/**
 * Theme toggle, wishlist, account and cart. The cart count comes in Phase 5.
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
      {/* The session is request data, so the menu streams in; the header itself stays static. */}
      <Suspense fallback={<SignInLink />}>
        <AccountMenu />
      </Suspense>
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
