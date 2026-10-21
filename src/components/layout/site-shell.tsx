import { Suspense } from "react";

import { Footer } from "./footer";
import { Header } from "./header";
import { PromoStrip } from "./promo-strip";

/** Promo strip, sticky header and footer around the storefront and account pages. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* The strip reads banners at request time; nothing shows until it's ready. */}
      <Suspense fallback={null}>
        <PromoStrip />
      </Suspense>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
