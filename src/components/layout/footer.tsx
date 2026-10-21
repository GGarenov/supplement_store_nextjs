import Link from "next/link";

import { CATEGORY_TREE } from "@/lib/categories";

import { Logo } from "./logo";

const STORE_LINKS = [
  { href: "/brands", label: "Brands" },
  { href: "/sale", label: "Sale" },
  { href: "/about", label: "About" },
];

const ACCOUNT_LINKS = [
  { href: "/account", label: "My account" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold tracking-wider uppercase">
        {title}
      </h2>
      <ul className="text-muted-foreground space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-card mt-auto border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground max-w-xs text-sm">
            Sports supplements from the brands athletes trust.
          </p>
        </div>
        <FooterColumn
          title="Shop"
          links={CATEGORY_TREE.map((g) => ({ href: g.href, label: g.name }))}
        />
        <FooterColumn title="Store" links={STORE_LINKS} />
        <FooterColumn title="Account" links={ACCOUNT_LINKS} />
      </div>
      <div className="border-t">
        <p className="text-muted-foreground mx-auto max-w-7xl px-4 py-4 text-xs">
          <strong className="text-foreground">
            Demo store, not a real shop.
          </strong>{" "}
          Healthy Street is a training project: no products are sold or shipped,
          and payments run in Stripe test mode.
        </p>
      </div>
    </footer>
  );
}
